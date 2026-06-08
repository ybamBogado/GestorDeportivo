using Application.Commands;
using Application.DTOs;
using Application.Handlers;
using Application.Interfaces;
using Application.Queries;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Api.Controllers
{
    [Route("api/v1/canchas")]
    [ApiController]
    public class CanchasController : ControllerBase
    {
        private readonly IGetCanchaCatalogQueryHandler _getCanchaCatalogQueryHandler;
        private readonly AppDbContext _context;

        public CanchasController(IGetCanchaCatalogQueryHandler getCanchaCatalogQueryHandler, AppDbContext context)
        {
            _getCanchaCatalogQueryHandler = getCanchaCatalogQueryHandler;
            _context = context;
        }

        // ── GET /api/v1/canchas ────────────────────────────────────────────────
        /// <summary>Catálogo completo de canchas.</summary>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<CanchaCatalogDto>>> GetCatalog()
        {
            var result = await _getCanchaCatalogQueryHandler.HandlerAsync(new GetCanchaCatalogQuery());
            return Ok(result);
        }

        // ── GET /api/v1/canchas/{id} ───────────────────────────────────────────
        /// <summary>Detalle de una cancha específica.</summary>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<CanchaCatalogDto>> GetById(int id, [FromServices] GetCanchaByIdQueryHandler handler)
        {
            var result = await handler.HandleAsync(new GetCanchaByIdQuery(id));
            if (result == null) return NotFound("Cancha no encontrada");
            return Ok(result);
        }

        // ── POST /api/v1/canchas ───────────────────────────────────────────────
        /// <summary>Crea una nueva cancha (Solo Administradores).</summary>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        public async Task<IActionResult> Create(
            [FromBody] CreateCanchaCommand command,
            [FromServices] CreateCanchaCommandHandler handler)
        {
            var id = await handler.HandleAsync(command);
            return CreatedAtAction(nameof(GetById), new { id }, "Cancha creada con éxito");
        }

        // ── PUT /api/v1/canchas/{id} ───────────────────────────────────────────
        /// <summary>Actualiza los datos de una cancha existente.</summary>
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Update(int id, [FromBody] CreateCanchaCommand command)
        {
            var cancha = await _context.Canchas.FindAsync(id);
            if (cancha == null) return NotFound("Cancha no encontrada");

            cancha.Superficie = command.Superficie;
            cancha.Capacidad = command.Capacidad;
            cancha.Estado = string.IsNullOrWhiteSpace(command.Estado) ? cancha.Estado : command.Estado;
            cancha.DuracionMaximaMinutos = command.DuracionMaximaMinutos;
            cancha.PrecioHora = command.PrecioHora;

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Cancha actualizada con éxito" });
        }

        // ── DELETE /api/v1/canchas/{id} ───────────────────────────────────────
        /// <summary>Elimina una cancha (solo si no tiene reservas activas).</summary>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Delete(int id)
        {
            var cancha = await _context.Canchas.FindAsync(id);
            if (cancha == null) return NotFound("Cancha no encontrada");

            var hayReservas = await _context.Reservas.AnyAsync(r =>
                r.CanchaId == id && r.Estado != "Cancelada" && r.Estado != "Expirada");
            if (hayReservas)
                return Conflict("No se puede eliminar una cancha con reservas activas.");

            _context.Canchas.Remove(cancha);
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Cancha eliminada con éxito" });
        }

        // ── GET /api/v1/canchas/bloqueos ──────────────────────────────────────
        /// <summary>
        /// Lista todos los bloqueos de mantenimiento registrados.
        /// El Empleado los usa para ver qué canchas están bloqueadas.
        /// </summary>
        [HttpGet("bloqueos")]
        public async Task<IActionResult> GetBloqueos([FromQuery] string? estado)
        {
            var query = _context.CanchaBloqueos.AsQueryable();
            if (!string.IsNullOrEmpty(estado))
                query = query.Where(b => b.Estado == estado);

            var bloqueos = await query
                .OrderByDescending(b => b.FechaHoraInicio)
                .Select(b => new
                {
                    b.Id,
                    b.CanchaId,
                    b.FechaHoraInicio,
                    b.FechaHoraFin,
                    b.Motivo,
                    b.Estado
                })
                .ToListAsync();

            return Ok(bloqueos);
        }

        // ── POST /api/v1/canchas/{id}/bloquear ────────────────────────────────
        /// <summary>
        /// Crea un bloqueo de mantenimiento para una cancha específica.
        /// Solo el Empleado (o Admin) puede usar este endpoint.
        /// El bloqueo impide que los usuarios reserven ese horario.
        /// </summary>
        [HttpPost("{id}/bloquear")]
        public async Task<IActionResult> BloquearCancha(int id, [FromBody] CrearBloqueoRequest request)
        {
            var cancha = await _context.Canchas.FindAsync(id);
            if (cancha == null) return NotFound("Cancha no encontrada.");

            if (request.FechaHoraFin <= request.FechaHoraInicio)
                return BadRequest("La fecha de fin debe ser posterior a la de inicio.");

            // Verificar solapamiento con bloqueos activos
            var haySolapamiento = await _context.CanchaBloqueos.AnyAsync(b =>
                b.CanchaId == id &&
                b.Estado == "Activo" &&
                b.FechaHoraInicio < request.FechaHoraFin &&
                b.FechaHoraFin > request.FechaHoraInicio);

            if (haySolapamiento)
                return Conflict("Ya existe un bloqueo activo en ese horario para esta cancha.");

            // Verificar solapamiento con reservas confirmadas
            var hayReservaConflicto = await _context.Reservas.AnyAsync(r =>
                r.CanchaId == id &&
                r.Fecha.Date == request.FechaHoraInicio.Date &&
                r.Estado != "Cancelada" && r.Estado != "Expirada" &&
                r.HoraInicio < request.FechaHoraFin.TimeOfDay &&
                r.HoraFin > request.FechaHoraInicio.TimeOfDay);

            if (hayReservaConflicto)
                return Conflict("Hay reservas activas en ese horario. Cancelalas primero o elegí otro período.");

            var bloqueo = new CanchaBloqueo
            {
                CanchaId = id,
                FechaHoraInicio = request.FechaHoraInicio,
                FechaHoraFin = request.FechaHoraFin,
                Motivo = request.Motivo ?? "Mantenimiento",
                Estado = "Activo"
            };

            _context.CanchaBloqueos.Add(bloqueo);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = $"✅ Bloqueo creado para la cancha #{id} del {request.FechaHoraInicio:dd/MM HH:mm} al {request.FechaHoraFin:dd/MM HH:mm}.",
                bloqueoId = bloqueo.Id
            });
        }

        // ── PUT /api/v1/canchas/bloqueos/{bloqueoId}/desactivar ───────────────
        /// <summary>
        /// Desactiva un bloqueo de mantenimiento.
        /// La cancha vuelve a estar disponible en ese horario.
        /// </summary>
        [HttpPut("bloqueos/{bloqueoId}/desactivar")]
        public async Task<IActionResult> DesactivarBloqueo(int bloqueoId)
        {
            var bloqueo = await _context.CanchaBloqueos.FindAsync(bloqueoId);
            if (bloqueo == null) return NotFound("Bloqueo no encontrado.");
            if (bloqueo.Estado == "Inactivo") return BadRequest("El bloqueo ya está inactivo.");

            bloqueo.Estado = "Inactivo";
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = $"✅ Bloqueo #{bloqueoId} desactivado. La cancha está disponible nuevamente." });
        }
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────
    public class CrearBloqueoRequest
    {
        public DateTime FechaHoraInicio { get; set; }
        public DateTime FechaHoraFin { get; set; }
        public string? Motivo { get; set; }
    }
}
