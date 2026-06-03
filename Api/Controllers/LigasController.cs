using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    [Route("api/v1/ligas")]
    [ApiController]
    public class LigasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LigasController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var ligas = await _context.Ligas
                .Include(l => l.Inscripciones)
                .Include(l => l.Partidos)
                .Select(l => new
                {
                    l.Id,
                    l.Nombre,
                    l.Reglamento,
                    l.Estado,
                    l.CupoEquipos,
                    EquiposInscriptos = l.Inscripciones.Count(i => i.Estado == "Activa"),
                    Partidos = l.Partidos.Count
                })
                .ToListAsync();

            return Ok(ligas);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var liga = await _context.Ligas
                .Include(l => l.Inscripciones).ThenInclude(i => i.Equipo)
                .Include(l => l.Partidos).ThenInclude(p => p.EquipoLocal)
                .Include(l => l.Partidos).ThenInclude(p => p.EquipoVisitante)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (liga == null) return NotFound("Liga no encontrada");
            return Ok(liga);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] LigaRequest request)
        {
            var liga = new Liga
            {
                Nombre = request.Nombre,
                Reglamento = request.Reglamento,
                Estado = string.IsNullOrWhiteSpace(request.Estado) ? "Abierta" : request.Estado,
                CupoEquipos = request.CupoEquipos <= 0 ? 16 : request.CupoEquipos,
                ComplejoId = request.ComplejoId
            };

            _context.Ligas.Add(liga);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = liga.Id }, liga);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] LigaRequest request)
        {
            var liga = await _context.Ligas.FindAsync(id);
            if (liga == null) return NotFound("Liga no encontrada");

            liga.Nombre = request.Nombre;
            liga.Reglamento = request.Reglamento;
            liga.Estado = string.IsNullOrWhiteSpace(request.Estado) ? liga.Estado : request.Estado;
            liga.CupoEquipos = request.CupoEquipos <= 0 ? liga.CupoEquipos : request.CupoEquipos;
            liga.ComplejoId = request.ComplejoId;

            await _context.SaveChangesAsync();
            return Ok(liga);
        }

        [HttpPost("{id}/equipos/{equipoId}")]
        public async Task<IActionResult> InscribirEquipo(int id, int equipoId)
        {
            var liga = await _context.Ligas.Include(l => l.Inscripciones).FirstOrDefaultAsync(l => l.Id == id);
            if (liga == null) return NotFound("Liga no encontrada");
            if (!await _context.Equipos.AnyAsync(e => e.Id == equipoId)) return NotFound("Equipo no encontrado");
            if (liga.Inscripciones.Count(i => i.Estado == "Activa") >= liga.CupoEquipos) return BadRequest("Cupo de liga agotado");
            if (liga.Inscripciones.Any(i => i.EquipoId == equipoId)) return BadRequest("El equipo ya está inscripto");

            liga.Inscripciones.Add(new InscripcionLiga { LigaId = id, EquipoId = equipoId });
            await _context.SaveChangesAsync();
            return Ok("Equipo inscripto en liga");
        }

        [HttpPost("{id}/fixture")]
        public async Task<IActionResult> GenerarFixture(int id, [FromBody] FixtureRequest? request)
        {
            var liga = await _context.Ligas
                .Include(l => l.Inscripciones)
                .Include(l => l.Partidos)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (liga == null) return NotFound("Liga no encontrada");
            if (liga.Partidos.Any()) return BadRequest("La liga ya tiene fixture generado");

            var equipos = liga.Inscripciones.Where(i => i.Estado == "Activa").Select(i => i.EquipoId).ToList();
            if (equipos.Count < 2) return BadRequest("Se necesitan al menos 2 equipos");

            var inicio = request?.FechaInicio ?? DateTime.UtcNow.Date.AddDays(1);
            var partidos = new List<Partido>();
            var fecha = inicio;

            for (var i = 0; i < equipos.Count; i++)
            {
                for (var j = i + 1; j < equipos.Count; j++)
                {
                    partidos.Add(new Partido
                    {
                        LigaId = liga.Id,
                        EquipoLocalId = equipos[i],
                        EquipoVisitanteId = equipos[j],
                        FechaHora = fecha,
                        Estado = "Programado"
                    });
                    fecha = fecha.AddDays(7);
                }
            }

            _context.Partidos.AddRange(partidos);
            liga.Estado = "En curso";
            await _context.SaveChangesAsync();
            return Ok(partidos);
        }

        [HttpPut("partidos/{partidoId}/resultado")]
        public async Task<IActionResult> RegistrarResultado(int partidoId, [FromBody] ResultadoRequest request)
        {
            var partido = await _context.Partidos.FindAsync(partidoId);
            if (partido == null) return NotFound("Partido no encontrado");

            partido.GolesLocal = request.GolesLocal;
            partido.GolesVisitante = request.GolesVisitante;
            partido.Estado = "Finalizado";

            await _context.SaveChangesAsync();
            return Ok(partido);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Cancelar(int id)
        {
            var liga = await _context.Ligas.FindAsync(id);
            if (liga == null) return NotFound("Liga no encontrada");

            liga.Estado = "Cancelada";
            await _context.SaveChangesAsync();
            return Ok("Liga cancelada");
        }

        public class LigaRequest
        {
            public string Nombre { get; set; } = string.Empty;
            public string Reglamento { get; set; } = string.Empty;
            public string Estado { get; set; } = "Abierta";
            public int CupoEquipos { get; set; } = 16;
            public int? ComplejoId { get; set; }
        }

        public class FixtureRequest
        {
            public DateTime FechaInicio { get; set; }
        }

        public class ResultadoRequest
        {
            public int GolesLocal { get; set; }
            public int GolesVisitante { get; set; }
        }
    }
}
