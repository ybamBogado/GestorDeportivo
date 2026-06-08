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

            // Descuento del 15% para equipos que juegan en ligas activas
            decimal descuento = 0;
            if (command.PersonaId > 0)
            {
                bool jugaEnLiga = await _context.InscripcionesLiga
                    .AnyAsync(i => i.Equipo.CapitanId == command.PersonaId
                               && i.Estado == "Confirmado");
                if (jugaEnLiga)
                    descuento = precio * 0.15m; // 15% de descuento por ser jugador regular de liga
            }

            var cobro = new Cobro
            {
                ReservaId  = reservaId,
                Concepto   = $"Alquiler de cancha - Reserva #{reservaId}",
                Monto      = precio,
                Descuento  = descuento,
                MontoFinal = precio - descuento,
                Estado     = "Pendiente",
                MetodoPago = string.Empty,
                Fecha      = DateTime.UtcNow
            };

            _context.Cobros.Add(cobro);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = reservaId }, new
            {
                reservaId,
                cobroId        = cobro.Id,
                monto          = cobro.Monto,
                descuento      = cobro.Descuento,
                montoFinal     = cobro.MontoFinal,
                descuentoAplicado = descuento > 0,
                concepto       = cobro.Concepto
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
    }
}
