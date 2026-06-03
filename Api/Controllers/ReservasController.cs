using Application.Commands;
using Application.Handlers;
using Application.Queries;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace Api.Controllers
{
    [Route("api/v1/reservas")]
    [ApiController]
    public class ReservasController : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromServices] GetReservasQueryHandler handler,
            [FromQuery] DateTime? fecha,
            [FromQuery] string? estado)
        {
            var result = await handler.HandleAsync(new GetReservasQuery { Fecha = fecha, Estado = estado });
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] CreateReservaCommand command,
            [FromServices] CreateReservaCommandHandler handler)
        {
            var id = await handler.HandleAsync(command);
            return CreatedAtAction(nameof(GetAll), new { id }, "Reserva creada con éxito");
        }

        [HttpPut("{id}/estado")]
        public async Task<IActionResult> UpdateEstado(
            int id,
            [FromBody] UpdateReservaEstadoCommand command,
            [FromServices] UpdateReservaEstadoCommandHandler handler)
        {
            if (id != command.Id)
            {
                return BadRequest("ID no coincide");
            }

            await handler.HandleAsync(command);
            return Ok("Estado de reserva actualizado con éxito");
        }
    }
}
