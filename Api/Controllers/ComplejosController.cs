using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    [Route("api/v1/complejos")]
    [ApiController]
    public class ComplejosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ComplejosController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var complejos = await _context.Complejos
                .Select(c => new
                {
                    c.Id,
                    c.Nombre,
                    c.Direccion,
                    c.Telefono,
                    Canchas = c.Canchas.Count,
                    Miembros = c.Miembros.Count
                })
                .ToListAsync();

            return Ok(complejos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var complejo = await _context.Complejos
                .Include(c => c.Canchas)
                .Include(c => c.Miembros)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (complejo == null) return NotFound("Complejo no encontrado");
            return Ok(complejo);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Complejo request)
        {
            _context.Complejos.Add(request);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = request.Id }, request);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Complejo request)
        {
            var complejo = await _context.Complejos.FindAsync(id);
            if (complejo == null) return NotFound("Complejo no encontrado");

            complejo.Nombre = request.Nombre;
            complejo.Direccion = request.Direccion;
            complejo.Telefono = request.Telefono;

            await _context.SaveChangesAsync();
            return Ok(complejo);
        }
    }
}
