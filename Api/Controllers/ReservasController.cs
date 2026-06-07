using Application.Commands;
using Application.Handlers;
using Application.Queries;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
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

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromServices] GetReservasQueryHandler handler,
            [FromQuery] DateTime? fecha,
            [FromQuery] string? estado)
        {
            var result = await handler.HandleAsync(new GetReservasQuery { Fecha = fecha, Estado = estado });
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var reserva = await _context.Reservas
                .Include(r => r.Cancha)
                .FirstOrDefaultAsync(r => r.Id == id);
            if (reserva == null) return NotFound("Reserva no encontrada");
            return Ok(reserva);
        }

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] CreateReservaCommand command,
            [FromServices] CreateReservaCommandHandler handler)
        {
            var reservaId = await handler.HandleAsync(command);

            // Auto-create a pending Cobro linked to this reserva
            var precio = command.Precio <= 0 ? 4500m : command.Precio;
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
                concepto = cobro.Concepto
            });
        }

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

        /// <summary>
        /// RF-19/RF-20: Cancela una reserva y aplica penalidad del 50% si faltan menos de 6 horas.
        /// </summary>
        [HttpPost("{id}/cancelar")]
        public async Task<IActionResult> Cancelar(int id)
        {
            var reserva = await _context.Reservas
                .Include(r => r.Cobro)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (reserva == null) return NotFound("Reserva no encontrada");
            if (reserva.Estado == "Cancelada")
                return BadRequest("La reserva ya está cancelada.");

            // Calcular penalidad (RF-20)
            var fechaHoraInicio = reserva.Fecha.Date + reserva.HoraInicio;
            var horasRestantes  = (fechaHoraInicio - DateTime.UtcNow).TotalHours;
            bool aplicaPenalidad = horasRestantes >= 0 && horasRestantes < 6;
            decimal penalidad    = 0m;

            if (aplicaPenalidad && reserva.Cobro != null)
            {
                penalidad = reserva.Cobro.MontoFinal * 0.5m;
                reserva.Cobro.Descuento = reserva.Cobro.MontoFinal * 0.5m;
                reserva.Cobro.MontoFinal = penalidad;
                reserva.Cobro.Estado    = "Penalidad";
                reserva.Cobro.Concepto  = $"{reserva.Cobro.Concepto} (Cancelación tardía — penalidad 50%)";
            }
            else if (reserva.Cobro != null && reserva.Cobro.Estado != "Pagado")
            {
                reserva.Cobro.Estado = "Anulado";
            }

            reserva.Estado = "Cancelada";
            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje       = aplicaPenalidad
                    ? $"Reserva cancelada con penalidad del 50% por cancelación con menos de 6 horas de anticipación."
                    : "Reserva cancelada sin penalidad.",
                aplicaPenalidad,
                montoFinal    = penalidad,
                horasRestantes = Math.Round(horasRestantes, 1)
            });
        }

        /// <summary>
        /// RF-22: Consulta disponibilidad de una cancha para una fecha y horario.
        /// </summary>
        [HttpGet("disponibilidad")]
        public async Task<IActionResult> CheckDisponibilidad(
            [FromQuery] int    canchaId,
            [FromQuery] DateTime fecha,
            [FromQuery] string horaInicio,
            [FromQuery] string horaFin,
            [FromServices] Application.Interfaces.Repositories.IReservaRepository repo)
        {
            if (!TimeSpan.TryParseExact(horaInicio, @"hh\:mm", System.Globalization.CultureInfo.InvariantCulture, out var ini))
                return BadRequest("Formato de hora inválido (use HH:mm).");
            if (!TimeSpan.TryParseExact(horaFin, @"hh\:mm", System.Globalization.CultureInfo.InvariantCulture, out var fin))
                return BadRequest("Formato de hora inválido (use HH:mm).");

            var disponible = await repo.IsAvailableAsync(canchaId, fecha, ini, fin);
            return Ok(new { disponible, canchaId, fecha, horaInicio, horaFin });
        }
    }
}
