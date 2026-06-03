using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    [Route("api/v1/cancha-bloqueos")]
    [ApiController]
    public class CanchaBloqueosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CanchaBloqueosController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var bloqueos = await _context.CanchaBloqueos
                .Include(b => b.Cancha)
                .OrderBy(b => b.FechaHoraInicio)
                .ToListAsync();

            return Ok(bloqueos);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CanchaBloqueo request)
        {
            if (request.FechaHoraFin <= request.FechaHoraInicio)
            {
                return BadRequest("La fecha de fin debe ser posterior al inicio");
            }

            _context.CanchaBloqueos.Add(request);
            await _context.SaveChangesAsync();
            return Ok(request);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Cancelar(int id)
        {
            var bloqueo = await _context.CanchaBloqueos.FindAsync(id);
            if (bloqueo == null) return NotFound("Bloqueo no encontrado");

            bloqueo.Estado = "Cancelado";
            await _context.SaveChangesAsync();
            return Ok("Bloqueo cancelado");
        }
    }
}
