using Application.DTOs;
using Application.Interfaces;
using Application.Queries;
using Application.Handlers;
using Application.Commands;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Api.Controllers
{
    [Route("api/v1/canchas")]
    [ApiController]
    public class CanchasController : ControllerBase
    {
        private readonly IGetCanchaCatalogQueryHandler _getCanchaCatalogQueryHandler;
        private readonly AppDbContext _context;

        public CanchasController(
            IGetCanchaCatalogQueryHandler getCanchaCatalogQueryHandler,
            AppDbContext context)
        {
            _getCanchaCatalogQueryHandler = getCanchaCatalogQueryHandler;
            _context = context;
        }

        /// <summary>
        /// Obtiene el catálogo completo de todas las canchas disponibles.
        /// </summary>
        /// <returns>Una lista de canchas resumidas en formato DTO.</returns>
        /// <response code="200">Retorna la lista de canchas exitosamente.</response>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<CanchaCatalogDto>>> GetCatalog()
        {
            var result = await _getCanchaCatalogQueryHandler.HandlerAsync(new GetCanchaCatalogQuery());
            return Ok(result);
        }

        /// <summary>
        /// Obtiene los detalles de una cancha específica por su ID.
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<CanchaCatalogDto>> GetById(int id, [FromServices] GetCanchaByIdQueryHandler handler)
        {
            var result = await handler.HandleAsync(new GetCanchaByIdQuery(id));
            if (result == null) return NotFound("Cancha no encontrada");
            return Ok(result);
        }

        /// <summary>
        /// Crea una nueva cancha (Solo Administradores).
        /// </summary>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        public async Task<IActionResult> Create([FromBody] CreateCanchaCommand command, [FromServices] CreateCanchaCommandHandler handler)
        {
            var id = await handler.HandleAsync(command);
            return CreatedAtAction(nameof(GetById), new { id }, "Cancha creada con éxito");
        }

        /// <summary>
        /// RF-08: Modifica los datos de una cancha existente.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateCanchaRequest request)
        {
            var cancha = await _context.Canchas.FindAsync(id);
            if (cancha == null) return NotFound("Cancha no encontrada");

            cancha.Superficie = request.Superficie ?? cancha.Superficie;
            cancha.Capacidad  = request.Capacidad > 0 ? request.Capacidad : cancha.Capacidad;
            cancha.Estado     = request.Estado ?? cancha.Estado;

            await _context.SaveChangesAsync();
            return Ok(cancha);
        }

        /// <summary>
        /// RF-10: Elimina (soft-delete) una cancha. La marca como "Inactiva" en lugar de borrarla.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var cancha = await _context.Canchas.FindAsync(id);
            if (cancha == null) return NotFound("Cancha no encontrada");

            // Soft-delete: marcar como Inactiva para preservar historial de reservas
            cancha.Estado = "Inactiva";
            await _context.SaveChangesAsync();
            return Ok("Cancha desactivada correctamente.");
        }
    }

    public class UpdateCanchaRequest
    {
        public string? Superficie { get; set; }
        public int     Capacidad  { get; set; }
        public string? Estado     { get; set; }
    }
}
