using Microsoft.AspNetCore.Mvc;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Api.Models;
namespace Api.Controllers
{
    [Route("api/v1/recibos")]
    [ApiController]
    public class RecibosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RecibosController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/v1/recibos
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var recibos = await _context.Recibos.Include(r => r.Cobro).ToListAsync();
            return Ok(recibos);
        }

        // GET: api/v1/recibos/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var recibo = await _context.Recibos.Include(r => r.Cobro)
                                            .FirstOrDefaultAsync(r => r.Id == id);
            if (recibo == null)
                return NotFound("Recibo no encontrado");
            return Ok(recibo);
        }

        // POST: api/v1/recibos
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ReciboRequest request)
        {
            var recibo = new Recibo
            {
                CobroId = request.CobroId,
                Numero = string.IsNullOrWhiteSpace(request.Numero) ? $"REC-{DateTime.UtcNow:yyyyMMddHHmmss}" : request.Numero,
                FechaEmision = request.FechaEmision ?? DateTime.UtcNow,
                Datos = request.Datos ?? string.Empty
            };

            _context.Recibos.Add(recibo);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = recibo.Id }, recibo);
        }

        // PUT: api/v1/recibos/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ReciboRequest request)
        {
            var recibo = await _context.Recibos.FindAsync(id);
            if (recibo == null) return NotFound("Recibo no encontrado");

            recibo.CobroId = request.CobroId;
            recibo.Numero = request.Numero ?? recibo.Numero;
            recibo.FechaEmision = request.FechaEmision ?? recibo.FechaEmision;
            recibo.Datos = request.Datos ?? recibo.Datos;

            await _context.SaveChangesAsync();
            return Ok(recibo);
        }

        // DELETE: api/v1/recibos/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var recibo = await _context.Recibos.FindAsync(id);
            if (recibo == null) return NotFound("Recibo no encontrado");

            _context.Recibos.Remove(recibo);
            await _context.SaveChangesAsync();
            return Ok("Recibo eliminado");
        }
    }
}
