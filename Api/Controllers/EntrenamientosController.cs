using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    [Route("api/v1/entrenamientos")]
    [ApiController]
    public class EntrenamientosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EntrenamientosController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] DateTime? desde, [FromQuery] DateTime? hasta)
        {
            var query = _context.Entrenamientos
                .Include(e => e.Cancha)
                .Include(e => e.Profesor)
                .Include(e => e.Alumnos)
                .AsQueryable();

            if (desde.HasValue) query = query.Where(e => e.Fecha >= desde.Value);
            if (hasta.HasValue) query = query.Where(e => e.Fecha <= hasta.Value);

            var entrenamientos = await query
                .OrderBy(e => e.Fecha)
                .Select(e => new
                {
                    e.Id,
                    e.Tipo,
                    e.Cronograma,
                    e.Fecha,
                    e.Estado,
                    Cancha = e.Cancha.Superficie,
                    Entrenador = $"{e.Profesor.Nombre} {e.Profesor.Apellido}",
                    Alumnos = e.Alumnos.Count
                })
                .ToListAsync();

            return Ok(entrenamientos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var entrenamiento = await _context.Entrenamientos
                .Include(e => e.Cancha)
                .Include(e => e.Profesor)
                .Include(e => e.Alumnos)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (entrenamiento == null) return NotFound("Entrenamiento no encontrado");

            return Ok(new
            {
                entrenamiento.Id,
                entrenamiento.Tipo,
                entrenamiento.Cronograma,
                entrenamiento.Fecha,
                entrenamiento.Estado,
                entrenamiento.CanchaId,
                Cancha = entrenamiento.Cancha.Superficie,
                entrenamiento.EntrenadorId,
                Entrenador = $"{entrenamiento.Profesor.Nombre} {entrenamiento.Profesor.Apellido}",
                Alumnos = entrenamiento.Alumnos.Select(a => new
                {
                    a.Id,
                    a.Nombre,
                    a.Apellido,
                    a.Email
                })
            });
        }

        [HttpPost("{id}/inscripciones")]
        public async Task<IActionResult> Inscribirse(int id, [FromBody] InscripcionEntrenamientoRequest request)
        {
            var entrenamiento = await _context.Entrenamientos
                .Include(e => e.Alumnos)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (entrenamiento == null) return NotFound("Entrenamiento no encontrado");
            if (string.Equals(entrenamiento.Estado, "Cancelado", StringComparison.OrdinalIgnoreCase))
                return BadRequest("El entrenamiento fue cancelado");

            var usuario = await _context.Usuarios.FindAsync(request.UsuarioId);
            if (usuario == null) return NotFound("Usuario no encontrado");

            if (entrenamiento.Alumnos.Any(a => a.Id == request.UsuarioId))
                return BadRequest("Ya estás inscripto en este entrenamiento");

            entrenamiento.Alumnos.Add(usuario);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                entrenamiento.Id,
                entrenamiento.Tipo,
                entrenamiento.Fecha,
                Estado = "Inscripto",
                Mensaje = "Inscripción a entrenamiento registrada correctamente."
            });
        }

        public class InscripcionEntrenamientoRequest
        {
            public int UsuarioId { get; set; }
        }
    }
}
