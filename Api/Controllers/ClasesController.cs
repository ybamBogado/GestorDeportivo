using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    [Route("api/v1/clases")]
    [ApiController]
    public class ClasesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ClasesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] DateTime? desde, [FromQuery] DateTime? hasta)
        {
            var query = _context.Clases
                .Include(c => c.Cancha)
                .Include(c => c.Profesor)
                .Include(c => c.Asistencias)
                .AsQueryable();

            if (desde.HasValue) query = query.Where(c => c.FechaHora >= desde.Value);
            if (hasta.HasValue) query = query.Where(c => c.FechaHora <= hasta.Value);

            var clases = await query
                .OrderBy(c => c.FechaHora)
                .Select(c => new
                {
                    c.Id,
                    c.Tipo,
                    c.FechaHora,
                    c.CapacidadMax,
                    c.Estado,
                    Cancha = c.Cancha.Superficie,
                    Profesor = $"{c.Profesor.Nombre} {c.Profesor.Apellido}",
                    Alumnos = c.Asistencias.Count,
                    CuposDisponibles = c.CapacidadMax - c.Asistencias.Count
                })
                .ToListAsync();

            return Ok(clases);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var clase = await _context.Clases
                .Include(c => c.Cancha)
                .Include(c => c.Profesor)
                .Include(c => c.Asistencias).ThenInclude(a => a.Usuario)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (clase == null) return NotFound("Clase no encontrada");
            return Ok(clase);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ClaseRequest request)
        {
            var profesor = await _context.Profesores.FindAsync(request.ProfesorId);
            if (profesor == null) return NotFound("Profesor no encontrado");
            if (!profesor.TieneCertificacionVigente()) return BadRequest("El profesor no tiene certificación vigente");

            var canchaDisponible = await CanchaDisponible(request.CanchaId, request.FechaHora, request.FechaHora.AddHours(1));
            if (!canchaDisponible) return BadRequest("La cancha no está disponible en ese horario");

            var clase = new Clase
            {
                CanchaId = request.CanchaId,
                ProfesorId = request.ProfesorId,
                Tipo = request.Tipo,
                FechaHora = request.FechaHora,
                CapacidadMax = request.CapacidadMax,
                Estado = string.IsNullOrWhiteSpace(request.Estado) ? "Programada" : request.Estado,
                ComplejoId = request.ComplejoId
            };

            _context.Clases.Add(clase);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = clase.Id }, clase);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ClaseRequest request)
        {
            var clase = await _context.Clases.FindAsync(id);
            if (clase == null) return NotFound("Clase no encontrada");

            var profesor = await _context.Profesores.FindAsync(request.ProfesorId);
            if (profesor == null) return NotFound("Profesor no encontrado");
            if (!profesor.TieneCertificacionVigente()) return BadRequest("El profesor no tiene certificación vigente");

            clase.CanchaId = request.CanchaId;
            clase.ProfesorId = request.ProfesorId;
            clase.Tipo = request.Tipo;
            clase.FechaHora = request.FechaHora;
            clase.CapacidadMax = request.CapacidadMax;
            clase.Estado = string.IsNullOrWhiteSpace(request.Estado) ? clase.Estado : request.Estado;
            clase.ComplejoId = request.ComplejoId;

            await _context.SaveChangesAsync();
            return Ok(clase);
        }

        [HttpPost("{id}/asistencias")]
        public async Task<IActionResult> RegistrarAsistencia(int id, [FromBody] AsistenciaRequest request)
        {
            var clase = await _context.Clases.Include(c => c.Asistencias).FirstOrDefaultAsync(c => c.Id == id);
            if (clase == null) return NotFound("Clase no encontrada");
            if (clase.Asistencias.Count >= clase.CapacidadMax && !clase.Asistencias.Any(a => a.UsuarioId == request.UsuarioId))
            {
                return BadRequest("Cupo de clase completo");
            }

            var usuario = await _context.Usuarios.FindAsync(request.UsuarioId);
            if (usuario == null) return NotFound("Usuario no encontrado");

            var asistencia = clase.Asistencias.FirstOrDefault(a => a.UsuarioId == request.UsuarioId);
            if (asistencia == null)
            {
                asistencia = new Asistencia
                {
                    ClaseId = id,
                    UsuarioId = request.UsuarioId,
                    Presente = request.Presente
                };
                clase.Asistencias.Add(asistencia);
            }
            else
            {
                asistencia.Presente = request.Presente;
                asistencia.FechaRegistro = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(asistencia);
        }

        [HttpPost("{id}/inscripciones")]
        public async Task<IActionResult> Inscribirse(int id, [FromBody] InscripcionClaseRequest request)
        {
            var clase = await _context.Clases
                .Include(c => c.Asistencias)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (clase == null) return NotFound("Clase no encontrada");
            if (clase.Estado == "Cancelada") return BadRequest("La clase fue cancelada");

            var usuario = await _context.Usuarios.FindAsync(request.UsuarioId);
            if (usuario == null) return NotFound("Usuario no encontrado");

            if (clase.Asistencias.Any(a => a.UsuarioId == request.UsuarioId))
                return BadRequest("Ya estás inscripto en esta clase");

            if (clase.Asistencias.Count >= clase.CapacidadMax)
                return BadRequest("Cupo de clase completo");

            var asistencia = new Asistencia
            {
                ClaseId = id,
                UsuarioId = request.UsuarioId,
                Presente = false
            };

            _context.Asistencias.Add(asistencia);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                asistencia.Id,
                ClaseId = clase.Id,
                clase.Tipo,
                clase.FechaHora,
                Estado = "Inscripto",
                Mensaje = "Inscripción a clase registrada correctamente."
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Cancelar(int id)
        {
            var clase = await _context.Clases.FindAsync(id);
            if (clase == null) return NotFound("Clase no encontrada");

            clase.Estado = "Cancelada";
            await _context.SaveChangesAsync();
            return Ok("Clase cancelada");
        }

        private async Task<bool> CanchaDisponible(int canchaId, DateTime inicio, DateTime fin)
        {
            var bloqueada = await _context.CanchaBloqueos.AnyAsync(b =>
                b.CanchaId == canchaId &&
                b.Estado == "Activo" &&
                inicio < b.FechaHoraFin &&
                fin > b.FechaHoraInicio);

            if (bloqueada) return false;

            return !await _context.Clases.AnyAsync(c =>
                c.CanchaId == canchaId &&
                c.Estado != "Cancelada" &&
                inicio < c.FechaHora.AddHours(1) &&
                fin > c.FechaHora);
        }

        public class ClaseRequest
        {
            public int CanchaId { get; set; }
            public int ProfesorId { get; set; }
            public string Tipo { get; set; } = string.Empty;
            public DateTime FechaHora { get; set; }
            public int CapacidadMax { get; set; }
            public string Estado { get; set; } = "Programada";
            public int? ComplejoId { get; set; }
        }

        public class AsistenciaRequest
        {
            public int UsuarioId { get; set; }
            public bool Presente { get; set; }
        }

        public class InscripcionClaseRequest
        {
            public int UsuarioId { get; set; }
        }
    }
}
