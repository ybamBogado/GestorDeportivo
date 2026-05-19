using Application.DTOs;
using Application.Interfaces;
using Application.Queries;
using Application.Handlers;
using Application.Commands;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Api.Controllers
{
    [Route("api/v1/canchas")]
    [ApiController]
    public class CanchasController : ControllerBase
    {
        private readonly IGetCanchaCatalogQueryHandler _getCanchaCatalogQueryHandler;

        public CanchasController(IGetCanchaCatalogQueryHandler getCanchaCatalogQueryHandler)
        {
            _getCanchaCatalogQueryHandler = getCanchaCatalogQueryHandler;
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
    }
}
