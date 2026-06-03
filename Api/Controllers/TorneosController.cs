using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    [Route("api/v1/torneos")]
    [ApiController]
    public class TorneosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TorneosController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var torneos = await _context.Torneos
                .Include(t => t.Inscripciones)
                .Include(t => t.Partidos)
                .Select(t => new
                {
                    t.Id,
                    t.Nombre,
                    t.Reglamento,
                    t.Formato,
                    t.Estado,
                    t.CupoEquipos,
                    EquiposInscriptos = t.Inscripciones.Count(i => i.Estado == "Activa"),
                    Partidos = t.Partidos.Count
                })
                .ToListAsync();

            return Ok(torneos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var torneo = await _context.Torneos
                .Include(t => t.Inscripciones).ThenInclude(i => i.Equipo)
                .Include(t => t.Partidos).ThenInclude(p => p.EquipoLocal)
                .Include(t => t.Partidos).ThenInclude(p => p.EquipoVisitante)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (torneo == null) return NotFound("Torneo no encontrado");
            return Ok(torneo);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TorneoRequest request)
        {
            var torneo = new Torneo
            {
                Nombre = request.Nombre,
                Reglamento = request.Reglamento,
                Formato = string.IsNullOrWhiteSpace(request.Formato) ? "EliminacionDirecta" : request.Formato,
                Estado = string.IsNullOrWhiteSpace(request.Estado) ? "Abierto" : request.Estado,
                CupoEquipos = request.CupoEquipos <= 0 ? 16 : request.CupoEquipos,
                ComplejoId = request.ComplejoId
            };

            _context.Torneos.Add(torneo);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = torneo.Id }, torneo);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] TorneoRequest request)
        {
            var torneo = await _context.Torneos.FindAsync(id);
            if (torneo == null) return NotFound("Torneo no encontrado");

            torneo.Nombre = request.Nombre;
            torneo.Reglamento = request.Reglamento;
            torneo.Formato = string.IsNullOrWhiteSpace(request.Formato) ? torneo.Formato : request.Formato;
            torneo.Estado = string.IsNullOrWhiteSpace(request.Estado) ? torneo.Estado : request.Estado;
            torneo.CupoEquipos = request.CupoEquipos <= 0 ? torneo.CupoEquipos : request.CupoEquipos;
            torneo.ComplejoId = request.ComplejoId;

            await _context.SaveChangesAsync();
            return Ok(torneo);
        }

        [HttpPost("{id}/equipos/{equipoId}")]
        public async Task<IActionResult> InscribirEquipo(int id, int equipoId)
        {
            var torneo = await _context.Torneos.Include(t => t.Inscripciones).FirstOrDefaultAsync(t => t.Id == id);
            if (torneo == null) return NotFound("Torneo no encontrado");
            if (!await _context.Equipos.AnyAsync(e => e.Id == equipoId)) return NotFound("Equipo no encontrado");
            if (torneo.Inscripciones.Count(i => i.Estado == "Activa") >= torneo.CupoEquipos) return BadRequest("Cupo de torneo agotado");
            if (torneo.Inscripciones.Any(i => i.EquipoId == equipoId)) return BadRequest("El equipo ya está inscripto");

            torneo.Inscripciones.Add(new InscripcionTorneo { TorneoId = id, EquipoId = equipoId });
            await _context.SaveChangesAsync();
            return Ok("Equipo inscripto en torneo");
        }

        [HttpPost("{id}/fixture")]
        public async Task<IActionResult> GenerarFixture(int id, [FromBody] FixtureRequest? request)
        {
            var torneo = await _context.Torneos
                .Include(t => t.Inscripciones)
                .Include(t => t.Partidos)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (torneo == null) return NotFound("Torneo no encontrado");
            if (torneo.Partidos.Any()) return BadRequest("El torneo ya tiene fixture generado");

            var equipos = torneo.Inscripciones.Where(i => i.Estado == "Activa").Select(i => i.EquipoId).ToList();
            if (equipos.Count < 2) return BadRequest("Se necesitan al menos 2 equipos");

            var inicio = request?.FechaInicio ?? DateTime.UtcNow.Date.AddDays(1);
            var partidos = new List<Partido>();

            if (torneo.Formato.Equals("TodosContraTodos", StringComparison.OrdinalIgnoreCase))
            {
                var fecha = inicio;
                for (var i = 0; i < equipos.Count; i++)
                {
                    for (var j = i + 1; j < equipos.Count; j++)
                    {
                        partidos.Add(new Partido
                        {
                            TorneoId = torneo.Id,
                            EquipoLocalId = equipos[i],
                            EquipoVisitanteId = equipos[j],
                            FechaHora = fecha,
                            Estado = "Programado"
                        });
                        fecha = fecha.AddDays(7);
                    }
                }
            }
            else
            {
                for (var i = 0; i < equipos.Count; i += 2)
                {
                    if (i + 1 >= equipos.Count) break;
                    partidos.Add(new Partido
                    {
                        TorneoId = torneo.Id,
                        EquipoLocalId = equipos[i],
                        EquipoVisitanteId = equipos[i + 1],
                        FechaHora = inicio.AddDays(i / 2),
                        Estado = "Programado"
                    });
                }
            }

            _context.Partidos.AddRange(partidos);
            torneo.Estado = "En curso";
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
            var torneo = await _context.Torneos.FindAsync(id);
            if (torneo == null) return NotFound("Torneo no encontrado");

            torneo.Estado = "Cancelado";
            await _context.SaveChangesAsync();
            return Ok("Torneo cancelado");
        }

        public class TorneoRequest
        {
            public string Nombre { get; set; } = string.Empty;
            public string Reglamento { get; set; } = string.Empty;
            public string Formato { get; set; } = "EliminacionDirecta";
            public string Estado { get; set; } = "Abierto";
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
