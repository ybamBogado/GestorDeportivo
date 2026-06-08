using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;

namespace Api.Controllers
{
    [Route("api/v1/partidos")]
    [ApiController]
    public class PartidosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PartidosController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int? ligaId,
            [FromQuery] int? torneoId,
            [FromQuery] int? fixtureId)
        {
            var query = _context.Partidos
                .Include(p => p.EquipoLocal)
                .Include(p => p.EquipoVisitante)
                .Include(p => p.Cancha)
                .Include(p => p.Fixture)
                .AsQueryable();

            if (ligaId.HasValue)    query = query.Where(p => p.LigaId == ligaId);
            if (torneoId.HasValue)  query = query.Where(p => p.TorneoId == torneoId);
            if (fixtureId.HasValue) query = query.Where(p => p.FixtureId == fixtureId);

            var partidos = await query
                .OrderBy(p => p.FechaHora)
                .Select(p => new
                {
                    p.Id,
                    p.LigaId,
                    p.TorneoId,
                    p.FixtureId,
                    EquipoLocal     = p.EquipoLocal.Nombre,
                    EquipoVisitante = p.EquipoVisitante.Nombre,
                    p.FechaHora,
                    Cancha          = p.Cancha == null ? null : p.Cancha.Superficie,
                    p.GolesLocal,
                    p.GolesVisitante,
                    p.Resultado,
                    p.Estado
                })
                .ToListAsync();

            return Ok(partidos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var partido = await _context.Partidos
                .Include(p => p.EquipoLocal)
                .Include(p => p.EquipoVisitante)
                .Include(p => p.Cancha)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (partido == null) return NotFound("Partido no encontrado");
            return Ok(partido);
        }

        /// <summary>
        /// Carga el resultado de un partido y lo marca como finalizado.
        /// </summary>
        [HttpPut("{id}/resultado")]
        public async Task<IActionResult> RegistrarResultado(int id, [FromBody] ResultadoRequest request)
        {
            var partido = await _context.Partidos
                .Include(p => p.EquipoLocal)
                .Include(p => p.EquipoVisitante)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (partido == null) return NotFound("Partido no encontrado");
            if (partido.Estado == "Cancelado") return BadRequest("No se puede cargar resultado de un partido cancelado");

            if (request.GolesLocal < 0 || request.GolesVisitante < 0)
                return BadRequest("Los goles no pueden ser negativos");

            partido.GolesLocal = request.GolesLocal;
            partido.GolesVisitante = request.GolesVisitante;
            partido.Estado = "Finalizado";

            if (partido.TorneoId.HasValue)
            {
                var torneo = await _context.Torneos
                    .Include(t => t.Fixtures).ThenInclude(f => f.Partidos)
                    .FirstOrDefaultAsync(t => t.Id == partido.TorneoId.Value);

                if (torneo != null && (torneo.Modalidad.Equals("Eliminacion", StringComparison.OrdinalIgnoreCase) || torneo.Formato.Equals("EliminacionDirecta", StringComparison.OrdinalIgnoreCase)))
                {
                    var currentFixture = torneo.Fixtures.FirstOrDefault(f => f.Id == partido.FixtureId);
                    if (currentFixture != null)
                    {
                        bool allFinished = currentFixture.Partidos.All(p => p.Estado == "Finalizado");
                        if (allFinished)
                        {
                            if (currentFixture.Partidos.Count > 1)
                            {
                                var winners = new List<int>();
                                foreach (var p in currentFixture.Partidos.OrderBy(p => p.Id))
                                {
                                    var winnerId = p.GolesLocal >= p.GolesVisitante ? p.EquipoLocalId : p.EquipoVisitanteId;
                                    winners.Add(winnerId);
                                }

                                var nextFixtureNumero = currentFixture.Numero + 1;
                                var nextFixtureExists = torneo.Fixtures.Any(f => f.Numero == nextFixtureNumero);
                                if (!nextFixtureExists)
                                {
                                    var nextFechaDesde = currentFixture.FechaHasta.AddDays(1);
                                    var nextFixture = new Fixture
                                    {
                                        Numero = nextFixtureNumero,
                                        TorneoId = torneo.Id,
                                        FechaDesde = nextFechaDesde,
                                        FechaHasta = nextFechaDesde.AddDays(6)
                                    };

                                    for (int i = 0; i < winners.Count; i += 2)
                                    {
                                        if (i + 1 >= winners.Count) break;
                                        nextFixture.Partidos.Add(new Partido
                                        {
                                            TorneoId = torneo.Id,
                                            EquipoLocalId = winners[i],
                                            EquipoVisitanteId = winners[i + 1],
                                            FechaHora = nextFechaDesde.AddHours(i),
                                            Estado = "Programado"
                                        });
                                    }

                                    _context.Fixtures.Add(nextFixture);
                                }
                            }
                            else
                            {
                                torneo.Estado = "Finalizado";
                            }
                        }
                    }
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                partido.Id,
                EquipoLocal = partido.EquipoLocal?.Nombre,
                EquipoVisitante = partido.EquipoVisitante?.Nombre,
                partido.GolesLocal,
                partido.GolesVisitante,
                partido.Resultado,
                partido.Estado
            });
        }

        /// <summary>
        /// Asigna o actualiza la cancha y fecha/hora de un partido.
        /// </summary>
        [HttpPut("{id}/programar")]
        public async Task<IActionResult> ProgramarPartido(int id, [FromBody] ProgramarRequest request)
        {
            var partido = await _context.Partidos.FindAsync(id);
            if (partido == null) return NotFound("Partido no encontrado");

            if (request.CanchaId.HasValue)
            {
                if (!await _context.Canchas.AnyAsync(c => c.Id == request.CanchaId))
                    return NotFound("Cancha no encontrada");

                // Verificar que la cancha esté libre en ese horario
                var inicio = request.FechaHora;
                var fin = inicio.AddHours(1.5);
                bool conflicto = await _context.CanchaBloqueos
                    .AnyAsync(b => b.CanchaId == request.CanchaId
                               && b.Estado == "Activo"
                               && b.FechaHoraInicio < fin
                               && b.FechaHoraFin > inicio);

                if (conflicto)
                    return Conflict("La cancha ya está bloqueada en ese horario");

                partido.CanchaId = request.CanchaId;

                // Crear bloqueo automático
                _context.CanchaBloqueos.Add(new CanchaBloqueo
                {
                    CanchaId = request.CanchaId.Value,
                    FechaHoraInicio = inicio,
                    FechaHoraFin = fin,
                    Motivo = $"Partido #{partido.Id}",
                    Estado = "Activo",
                    Tipo = TipoBloqueo.Partido,
                    PartidoId = partido.Id
                });
            }

            if (request.FechaHora != default)
                partido.FechaHora = request.FechaHora;

            await _context.SaveChangesAsync();
            return Ok(partido);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Cancelar(int id)
        {
            var partido = await _context.Partidos.FindAsync(id);
            if (partido == null) return NotFound("Partido no encontrado");

            partido.Estado = "Cancelado";

            // Liberar bloqueo de cancha si existe
            var bloqueos = await _context.CanchaBloqueos
                .Where(b => b.PartidoId == id && b.Estado == "Activo")
                .ToListAsync();
            foreach (var b in bloqueos) b.Estado = "Liberado";

            await _context.SaveChangesAsync();
            return Ok("Partido cancelado");
        }

        public class ResultadoRequest
        {
            public int GolesLocal { get; set; }
            public int GolesVisitante { get; set; }
        }

        public class ProgramarRequest
        {
            public int? CanchaId { get; set; }
            public DateTime FechaHora { get; set; }
        }
    }
}
