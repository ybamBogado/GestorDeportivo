using Application.Commands;
using Application.Handlers;
using Application.Queries;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Api.Controllers
{
    [Route("api/v1/reservas")]
    [ApiController]
    public class ReservasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReservasController(AppDbContext context)
        {
            _context = context;
        }

        // ── GET /api/v1/reservas ────────────────────────────────────────────────
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromServices] GetReservasQueryHandler handler,
            [FromQuery] DateTime? fecha,
            [FromQuery] string? estado)
        {
            // Auto-expire reservas Pendientes vencidas antes de retornar
            await ExpireOldPendingReservasAsync();

            var result = await handler.HandleAsync(new GetReservasQuery { Fecha = fecha, Estado = estado });
            return Ok(result);
        }

        // ── GET /api/v1/reservas/{id} ───────────────────────────────────────────
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var reserva = await _context.Reservas
                .Include(r => r.Cancha)
                .FirstOrDefaultAsync(r => r.Id == id);
            if (reserva == null) return NotFound("Reserva no encontrada");
            return Ok(reserva);
        }

        // ── GET /api/v1/reservas/disponibilidad ────────────────────────────────
        /// <summary>
        /// Retorna los slots ocupados para una cancha en una fecha determinada.
        /// Incluye reservas Pendiente, PendienteVerificacion y Confirmada.
        /// El frontend usa esta info para colorear los botones.
        /// </summary>
        [HttpGet("disponibilidad")]
        public async Task<IActionResult> GetDisponibilidad(
            [FromQuery] int canchaId,
            [FromQuery] DateTime fecha)
        {
            await ExpireOldPendingReservasAsync();

            var cancha = await _context.Canchas.FindAsync(canchaId);
            if (cancha == null) return NotFound("Cancha no encontrada");

            var fechaDate = fecha.Date;

            // Reservas activas ese día
            var reservasOcupadas = await _context.Reservas
                .Where(r => r.CanchaId == canchaId
                         && r.Fecha.Date == fechaDate
                         && (r.Estado == "Pendiente" || r.Estado == "PendienteVerificacion" || r.Estado == "Confirmada"))
                .Select(r => new { r.HoraInicio, r.HoraFin, r.Estado })
                .ToListAsync();

            // Bloqueos de mantenimiento ese día
            var bloqueos = await _context.CanchaBloqueos
                .Where(b => b.CanchaId == canchaId
                         && b.Estado == "Activo"
                         && b.FechaHoraInicio.Date == fechaDate)
                .Select(b => new { b.FechaHoraInicio, b.FechaHoraFin, Motivo = b.Motivo })
                .ToListAsync();

            return Ok(new
            {
                canchaId,
                fecha = fechaDate,
                duracionMaximaMinutos = cancha.GetDuracionMaxima(),
                precioHora = cancha.PrecioHora,
                reservasOcupadas,
                bloqueos
            });
        }

        // ── POST /api/v1/reservas ───────────────────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] CreateReservaCommand command,
            [FromServices] CreateReservaCommandHandler handler)
        {
            // ── Regla 1: Antelación máxima de 30 días ──────────────────────────
            if (command.Fecha.Date > DateTime.UtcNow.Date.AddDays(30))
                return BadRequest("No se pueden realizar reservas con más de 30 días de antelación.");

            // ── Regla 2: No reservar en el pasado ──────────────────────────────
            if (command.Fecha.Date < DateTime.UtcNow.Date)
                return BadRequest("No se pueden realizar reservas en fechas pasadas.");

            // ── Regla 3: Duración máxima según tipo de cancha ──────────────────
            var cancha = await _context.Canchas.FindAsync(command.CanchaId);
            if (cancha == null) return NotFound("Cancha no encontrada.");

            if (TimeSpan.TryParse(command.HoraInicio, out var horaInicio) &&
                TimeSpan.TryParse(command.HoraFin, out var horaFin))
            {
                var duracionSolicitada = (horaFin - horaInicio).TotalMinutes;
                if (duracionSolicitada > cancha.GetDuracionMaxima())
                    return BadRequest($"La duración solicitada ({duracionSolicitada} min) supera el máximo permitido para esta cancha ({cancha.GetDuracionMaxima()} min).");
                if (duracionSolicitada <= 0)
                    return BadRequest("La hora de fin debe ser posterior a la hora de inicio.");
            }

            // ── Regla 4: Solapamiento con otras reservas o bloqueos ────────────
            var fechaDate = command.Fecha.Date;
            TimeSpan.TryParse(command.HoraInicio, out var ini);
            TimeSpan.TryParse(command.HoraFin, out var fin);

            var hayConflicto = await _context.Reservas.AnyAsync(r =>
                r.CanchaId == command.CanchaId &&
                r.Fecha.Date == fechaDate &&
                r.Estado != "Cancelada" && r.Estado != "Expirada" &&
                r.HoraInicio < fin && r.HoraFin > ini);

            if (hayConflicto)
                return Conflict("El horario seleccionado ya está reservado o en proceso de pago. Por favor elegí otro turno.");

            var hayBloqueo = await _context.CanchaBloqueos.AnyAsync(b =>
                b.CanchaId == command.CanchaId &&
                b.Estado == "Activo" &&
                b.FechaHoraInicio.Date == fechaDate &&
                b.FechaHoraInicio.TimeOfDay < fin &&
                b.FechaHoraFin.TimeOfDay > ini);

            if (hayBloqueo)
                return Conflict("La cancha está bloqueada por mantenimiento en ese horario.");

            // ── Crear la reserva (estado Pendiente + soft-lock) ────────────────
            var metodoPago = command.MetodoPago ?? "Tarjeta";
            DateTime expiracion = metodoPago switch
            {
                "transferencia" => DateTime.UtcNow.AddHours(2),
                "efectivo"      => DateTime.UtcNow.AddHours(12),
                _               => DateTime.UtcNow.AddMinutes(15),   // tarjeta
            };

            string? codigoPago = null;
            if (metodoPago == "efectivo")
            {
                // Genera código tipo Rapipago: RP-XXXXX
                codigoPago = $"RP-{new Random().Next(10000, 99999)}";
            }

            var reservaId = await handler.HandleAsync(command);

            // Actualizar los campos extra que el handler no conoce
            var reservaCreada = await _context.Reservas.FindAsync(reservaId);
            if (reservaCreada != null)
            {
                reservaCreada.MetodoPago = metodoPago;
                reservaCreada.FechaExpiracion = expiracion;
                reservaCreada.CodigoPagoExterno = codigoPago;
                await _context.SaveChangesAsync();
            }

            // Auto-crear Cobro pendiente vinculado a esta reserva
            var precio = cancha.PrecioHora > 0 ? cancha.PrecioHora : (command.Precio <= 0 ? 4500m : command.Precio);
            var cobro = new Cobro
            {
                ReservaId = reservaId,
                Concepto = $"Alquiler de cancha - Reserva #{reservaId}",
                Monto = precio,
                Descuento = 0,
                MontoFinal = precio,
                Estado = "Pendiente",
                MetodoPago = string.Empty,
                Fecha = DateTime.UtcNow
            };

            _context.Cobros.Add(cobro);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = reservaId }, new
            {
                reservaId,
                cobroId = cobro.Id,
                monto = cobro.Monto,
                concepto = cobro.Concepto,
                estado = "Pendiente",
                fechaExpiracion = expiracion,
                codigoPagoExterno = codigoPago,
                metodoPago
            });
        }

        // ── PUT /api/v1/reservas/{id}/estado ───────────────────────────────────
        [HttpPut("{id}/estado")]
        public async Task<IActionResult> UpdateEstado(
            int id,
            [FromBody] UpdateReservaEstadoCommand command,
            [FromServices] UpdateReservaEstadoCommandHandler handler)
        {
            if (id != command.Id)
                return BadRequest("ID no coincide");

            await handler.HandleAsync(command);
            return Ok("Estado de reserva actualizado con éxito");
        }

        // ── POST /api/v1/reservas/{id}/cancelar ────────────────────────────────
        /// <summary>
        /// Cancela una reserva aplicando la política de reembolsos.
        /// &gt;= 6h antes: reembolso total disponible.
        /// &lt; 6h antes: pérdida del monto (o % configurable).
        /// </summary>
        [HttpPost("{id}/cancelar")]
        public async Task<IActionResult> Cancelar(int id)
        {
            var reserva = await _context.Reservas
                .Include(r => r.Cobro)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (reserva == null) return NotFound("Reserva no encontrada");

            if (reserva.Estado == "Cancelada")
                return BadRequest("La reserva ya fue cancelada.");

            if (reserva.Estado != "Confirmada" && reserva.Estado != "PendienteVerificacion" && reserva.Estado != "Pendiente")
                return BadRequest($"No se puede cancelar una reserva en estado '{reserva.Estado}'.");

            var horasRestantes = (reserva.FechaHoraInicio - DateTime.UtcNow).TotalHours;
            var esCancelacionAtiempo = horasRestantes >= 6;

            reserva.Estado = "Cancelada";
            await _context.SaveChangesAsync();

            return Ok(new
            {
                reservaId = id,
                horasRestantes = Math.Round(horasRestantes, 1),
                esCancelacionAtiempo,
                politicaReembolso = esCancelacionAtiempo
                    ? "Reembolso total (100%). El empleado/admin puede generar el Recibo de Reembolso."
                    : "Cancelación tardía (< 6 horas). Se aplica penalidad según la política del club. Corresponde reembolso parcial o cero.",
                mensaje = esCancelacionAtiempo
                    ? "Reserva cancelada. Se procesará un reembolso total."
                    : "Reserva cancelada fuera del plazo. Se aplicará un cargo por cancelación tardía."
            });
        }

        // ── POST /api/v1/reservas/simular-pago-externo ────────────────────────
        /// <summary>
        /// HERRAMIENTA DE DEMO ACADÉMICA: Simula el webhook de Rapipago/PagoFácil.
        /// En producción real, este endpoint lo llamaría la red de cobranzas.
        /// </summary>
        [HttpPost("simular-pago-externo")]
        public async Task<IActionResult> SimularPagoExterno([FromBody] SimularPagoExternoRequest request)
        {
            var reserva = await _context.Reservas
                .Include(r => r.Cobro)
                .FirstOrDefaultAsync(r => r.CodigoPagoExterno == request.CodigoPago);

            if (reserva == null)
                return NotFound($"No se encontró ninguna reserva con el código '{request.CodigoPago}'.");

            if (reserva.Estado != "Pendiente")
                return BadRequest($"La reserva ya fue procesada (estado: {reserva.Estado}).");

            if (DateTime.UtcNow > reserva.FechaExpiracion)
            {
                reserva.Estado = "Expirada";
                await _context.SaveChangesAsync();
                return BadRequest("El código de pago expiró. La reserva fue cancelada.");
            }

            // Confirmar reserva
            reserva.Estado = "Confirmada";
            reserva.Pago = true;

            // Marcar cobro como pagado y emitir recibo
            if (reserva.Cobro != null)
            {
                reserva.Cobro.Estado = "Pagado";
                reserva.Cobro.MetodoPago = "Efectivo (Rapipago)";

                var recibo = new Recibo
                {
                    CobroId = reserva.Cobro.Id,
                    Numero = $"REC-EXT-{DateTime.UtcNow:yyyyMMddHHmmss}",
                    FechaEmision = DateTime.UtcNow,
                    Datos = $"Pago en efectivo vía red de cobranza. Código: {request.CodigoPago}. Monto: {reserva.Cobro.MontoFinal}"
                };
                _context.Recibos.Add(recibo);
            }

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "✅ Pago externo simulado con éxito. Reserva Confirmada.", reservaId = reserva.Id });
        }

        // ── Método interno: Expirar reservas vencidas ─────────────────────────
        private async Task ExpireOldPendingReservasAsync()
        {
            var vencidas = await _context.Reservas
                .Where(r => r.Estado == "Pendiente" && r.FechaExpiracion < DateTime.UtcNow)
                .ToListAsync();

            foreach (var r in vencidas)
                r.Estado = "Expirada";

            if (vencidas.Any())
                await _context.SaveChangesAsync();
        }
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────
    public class SimularPagoExternoRequest
    {
        public string CodigoPago { get; set; } = string.Empty;
    }
}
