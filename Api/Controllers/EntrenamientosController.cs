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
        private const decimal CostoInscripcionEntrenamiento = 2500m;

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
                    EntrenadorId = e.EntrenadorId,
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
                .Include(e => e.Inscripciones).ThenInclude(i => i.Usuario)
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
                Inscripciones = entrenamiento.Inscripciones.Select(i => new
                {
                    i.Id,
                    i.UsuarioId,
                    Usuario = new { i.Usuario.Id, i.Usuario.Nombre, i.Usuario.Apellido, i.Usuario.Email },
                    i.Estado,
                    i.Presente
                })
            });
        }

        [HttpPost("{id}/inscripciones")]
        public async Task<IActionResult> Inscribirse(int id, [FromBody] InscripcionEntrenamientoRequest request)
        {
            var entrenamiento = await _context.Entrenamientos
                .Include(e => e.Alumnos)
                .Include(e => e.Inscripciones)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (entrenamiento == null) return NotFound("Entrenamiento no encontrado");
            if (string.Equals(entrenamiento.Estado, "Cancelado", StringComparison.OrdinalIgnoreCase))
                return BadRequest("El entrenamiento fue cancelado");

            var usuario = await _context.Usuarios.FindAsync(request.UsuarioId);
            if (usuario == null) return NotFound("Usuario no encontrado");

            if (entrenamiento.Alumnos.Any(a => a.Id == request.UsuarioId) || entrenamiento.Inscripciones.Any(i => i.UsuarioId == request.UsuarioId))
                return BadRequest("Ya estas inscripto en este entrenamiento");

            var cobro = new Cobro
            {
                Concepto = $"Inscripcion Entrenamiento '{entrenamiento.Tipo}' - {usuario.Nombre} {usuario.Apellido}",
                Monto = CostoInscripcionEntrenamiento,
                Descuento = 0,
                MontoFinal = CostoInscripcionEntrenamiento,
                Estado = "Pendiente",
                MetodoPago = string.Empty,
                Fecha = DateTime.UtcNow
            };
            _context.Cobros.Add(cobro);
            await _context.SaveChangesAsync();

            var inscripcion = new InscripcionEntrenamiento
            {
                EntrenamientoId = id,
                UsuarioId = request.UsuarioId,
                CobroId = cobro.Id,
                Estado = "Pendiente"
            };
            _context.InscripcionesEntrenamiento.Add(inscripcion);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                inscripcion.Id,
                cobroId = cobro.Id,
                EntrenamientoId = entrenamiento.Id,
                Tipo = entrenamiento.Tipo,
                Fecha = entrenamiento.Fecha,
                Monto = cobro.MontoFinal,
                Estado = "Pendiente",
                Mensaje = "Inscripcion registrada. Completa el pago para confirmar tu lugar."
            });
        }

        [HttpPost("{id}/asistencias")]
        public async Task<IActionResult> RegistrarAsistencia(int id, [FromBody] AsistenciaEntrenamientoRequest request)
        {
            var inscripcion = await _context.InscripcionesEntrenamiento
                .FirstOrDefaultAsync(i => i.EntrenamientoId == id && i.UsuarioId == request.UsuarioId);

            if (inscripcion == null) return NotFound("Inscripción no encontrada");

            inscripcion.Presente = request.Presente;
            await _context.SaveChangesAsync();

            return Ok(inscripcion);
        }

        public class InscripcionEntrenamientoRequest
        {
            public int UsuarioId { get; set; }
        }

        public class AsistenciaEntrenamientoRequest
        {
            public int UsuarioId { get; set; }
            public bool Presente { get; set; }
        }
    }
}
