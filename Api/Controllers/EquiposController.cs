using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    [Route("api/v1/equipos")]
    [ApiController]
    public class EquiposController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EquiposController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var equipos = await _context.Equipos
                .Include(e => e.Capitan)
                .Include(e => e.Jugadores)
                .Select(e => new
                {
                    e.Id,
                    e.Nombre,
                    e.Categoria,
                    e.Estado,
                    e.CapitanId,
                    Capitan = e.Capitan == null ? null : $"{e.Capitan.Nombre} {e.Capitan.Apellido}",
                    Jugadores = e.Jugadores.Count
                })
                .ToListAsync();

            return Ok(equipos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var equipo = await _context.Equipos
                .Include(e => e.Capitan)
                .Include(e => e.Jugadores)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (equipo == null) return NotFound("Equipo no encontrado");
            return Ok(new
            {
                equipo.Id,
                equipo.Nombre,
                equipo.Categoria,
                equipo.Estado,
                equipo.CapitanId,
                Capitan = equipo.Capitan == null ? null : new
                {
                    equipo.Capitan.Id,
                    equipo.Capitan.Nombre,
                    equipo.Capitan.Apellido,
                    equipo.Capitan.Email
                },
                Miembros = equipo.Jugadores.Select(j => new
                {
                    j.Id,
                    j.Nombre,
                    j.Apellido,
                    j.Email
                })
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] EquipoRequest request)
        {
            var equipo = new Equipo
            {
                Nombre = request.Nombre,
                Categoria = request.Categoria,
                Estado = string.IsNullOrWhiteSpace(request.Estado) ? "Activo" : request.Estado,
                CapitanId = request.CapitanId
            };

            _context.Equipos.Add(equipo);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = equipo.Id }, equipo);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] EquipoRequest request)
        {
            var equipo = await _context.Equipos.FindAsync(id);
            if (equipo == null) return NotFound("Equipo no encontrado");

            equipo.Nombre = request.Nombre;
            equipo.Categoria = request.Categoria;
            equipo.Estado = string.IsNullOrWhiteSpace(request.Estado) ? equipo.Estado : request.Estado;
            equipo.CapitanId = request.CapitanId;

            await _context.SaveChangesAsync();
            return Ok(equipo);
        }

        [HttpPost("{id}/jugadores/{usuarioId}")]
        public async Task<IActionResult> AddJugador(int id, int usuarioId)
        {
            var equipo = await _context.Equipos.Include(e => e.Jugadores).FirstOrDefaultAsync(e => e.Id == id);
            if (equipo == null) return NotFound("Equipo no encontrado");

            var usuario = await _context.Usuarios.FindAsync(usuarioId);
            if (usuario == null) return NotFound("Usuario no encontrado");

            if (!equipo.Jugadores.Any(j => j.Id == usuarioId))
            {
                equipo.Jugadores.Add(usuario);
                await _context.SaveChangesAsync();
            }

            return Ok("Jugador agregado al equipo");
        }

        [HttpPost("{id}/inscripciones")]
        public async Task<IActionResult> InscribirseAEquipo(int id, [FromBody] InscripcionEquipoRequest request)
        {
            var equipo = await _context.Equipos
                .Include(e => e.Capitan)
                .Include(e => e.Jugadores)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (equipo == null) return NotFound("Equipo no encontrado");

            var usuario = await _context.Usuarios.FindAsync(request.UsuarioId);
            if (usuario == null) return NotFound("Usuario no encontrado");

            if (equipo.CapitanId == request.UsuarioId || equipo.Jugadores.Any(j => j.Id == request.UsuarioId))
                return BadRequest("Ya formas parte de este equipo");

            equipo.Jugadores.Add(usuario);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                equipo.Id,
                equipo.Nombre,
                Miembros = equipo.Jugadores.Count,
                Mensaje = "Te inscribiste al equipo correctamente."
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var equipo = await _context.Equipos.FindAsync(id);
            if (equipo == null) return NotFound("Equipo no encontrado");

            _context.Equipos.Remove(equipo);
            await _context.SaveChangesAsync();
            return Ok("Equipo eliminado");
        }

        public class EquipoRequest
        {
            public string Nombre { get; set; } = string.Empty;
            public string Categoria { get; set; } = string.Empty;
            public string Estado { get; set; } = "Activo";
            public int? CapitanId { get; set; }
        }

        public class InscripcionEquipoRequest
        {
            public int UsuarioId { get; set; }
        }
    }
}
