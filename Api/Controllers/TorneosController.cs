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
                    t.FechaInicio,
                    t.FechaFin,
                    t.Categoria,
                    t.PremioUSD,
                    t.Modalidad,
                    t.CostoInscripcion,
                    EquiposConfirmados = t.Inscripciones.Count(i => i.Estado == "Confirmado"),
                    EquiposPendientes  = t.Inscripciones.Count(i => i.Estado == "Pendiente"),
                    Partidos           = t.Partidos.Count
                })
                .ToListAsync();

            return Ok(torneos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var torneo = await _context.Torneos
                .Include(t => t.Inscripciones).ThenInclude(i => i.Equipo)
                .Include(t => t.Inscripciones).ThenInclude(i => i.Cobro)
                .Include(t => t.Partidos).ThenInclude(p => p.EquipoLocal)
                .Include(t => t.Partidos).ThenInclude(p => p.EquipoVisitante)
                .Include(t => t.Fixtures)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (torneo == null) return NotFound("Torneo no encontrado");
            return Ok(torneo);
        }

        /// <summary>GET /torneos/{id}/fixtures — devuelve las jornadas con sus partidos</summary>
        [HttpGet("{id}/fixtures")]
        public async Task<IActionResult> GetFixtures(int id)
        {
            if (!await _context.Torneos.AnyAsync(t => t.Id == id))
                return NotFound("Torneo no encontrado");

            var fixtures = await _context.Fixtures
                .Where(f => f.TorneoId == id)
                .Include(f => f.Partidos).ThenInclude(p => p.EquipoLocal)
                .Include(f => f.Partidos).ThenInclude(p => p.EquipoVisitante)
                .Include(f => f.Partidos).ThenInclude(p => p.Cancha)
                .OrderBy(f => f.Numero)
                .Select(f => new
                {
                    f.Id,
                    f.Numero,
                    f.FechaDesde,
                    f.FechaHasta,
                    Partidos = f.Partidos.Select(p => new
                    {
                        p.Id,
                        EquipoLocal     = p.EquipoLocal.Nombre,
                        EquipoVisitante = p.EquipoVisitante.Nombre,
                        p.FechaHora,
                        Cancha          = p.Cancha == null ? null : p.Cancha.Superficie,
                        p.GolesLocal,
                        p.GolesVisitante,
                        p.Resultado,
                        p.Estado
                    })
                })
                .ToListAsync();

            return Ok(fixtures);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TorneoRequest request)
        {
            var torneo = new Torneo
            {
                Nombre           = request.Nombre,
                Reglamento       = request.Reglamento,
                Formato          = string.IsNullOrWhiteSpace(request.Formato) ? "EliminacionDirecta" : request.Formato,
                Estado           = string.IsNullOrWhiteSpace(request.Estado) ? "Abierto" : request.Estado,
                CupoEquipos      = request.CupoEquipos <= 0 ? 16 : request.CupoEquipos,
                ComplejoId       = request.ComplejoId,
                FechaInicio      = request.FechaInicio == default ? DateTime.UtcNow : request.FechaInicio,
                FechaFin         = request.FechaFin == default ? DateTime.UtcNow.AddMonths(1) : request.FechaFin,
                Categoria        = string.IsNullOrWhiteSpace(request.Categoria) ? "Primera" : request.Categoria,
                PremioUSD        = request.PremioUSD < 0 ? 0 : request.PremioUSD,
                Modalidad        = string.IsNullOrWhiteSpace(request.Modalidad) ? "Eliminacion" : request.Modalidad,
                CostoInscripcion = request.CostoInscripcion < 0 ? 0 : request.CostoInscripcion
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

            torneo.Nombre      = request.Nombre;
            torneo.Reglamento  = request.Reglamento;
            torneo.Formato     = string.IsNullOrWhiteSpace(request.Formato) ? torneo.Formato : request.Formato;
            torneo.Estado      = string.IsNullOrWhiteSpace(request.Estado) ? torneo.Estado : request.Estado;
            torneo.CupoEquipos = request.CupoEquipos <= 0 ? torneo.CupoEquipos : request.CupoEquipos;
            torneo.ComplejoId  = request.ComplejoId;
            if (request.FechaInicio != default)                 torneo.FechaInicio      = request.FechaInicio;
            if (request.FechaFin != default)                    torneo.FechaFin         = request.FechaFin;
            if (!string.IsNullOrWhiteSpace(request.Categoria))  torneo.Categoria        = request.Categoria;
            if (request.PremioUSD >= 0)                         torneo.PremioUSD        = request.PremioUSD;
            if (!string.IsNullOrWhiteSpace(request.Modalidad))  torneo.Modalidad        = request.Modalidad;
            if (request.CostoInscripcion >= 0)                  torneo.CostoInscripcion = request.CostoInscripcion;

            await _context.SaveChangesAsync();
            return Ok(torneo);
        }

        /// <summary>
        /// Genera el fixture para el torneo.
        /// SOLO incluye equipos con Estado="Confirmado" (inscripción pagada).
        /// </summary>
        [HttpPost("{id}/fixture")]
        public async Task<IActionResult> GenerarFixture(int id, [FromBody] FixtureRequest? request)
        {
            var torneo = await _context.Torneos
                .Include(t => t.Inscripciones)
                .Include(t => t.Partidos)
                .Include(t => t.Fixtures)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (torneo == null) return NotFound("Torneo no encontrado");
            if (torneo.Fixtures.Any()) return BadRequest("El torneo ya tiene fixture generado");

            // Solo equipos que pagaron
            var equiposConfirmados = torneo.Inscripciones
                .Where(i => i.Estado == "Confirmado")
                .Select(i => i.EquipoId)
                .ToList();

            if (equiposConfirmados.Count < 2)
                return BadRequest("Se necesitan al menos 2 equipos con inscripción confirmada (pagada) para generar el fixture");

            var inicio = request?.FechaInicio ?? DateTime.UtcNow.Date.AddDays(7);
            var fixtures = new List<Fixture>();
            int jornada = 1;

            bool esTodosVsTodos = torneo.Modalidad.Equals("TodosVsTodos", StringComparison.OrdinalIgnoreCase)
                               || torneo.Formato.Equals("TodosContraTodos", StringComparison.OrdinalIgnoreCase);

            if (esTodosVsTodos)
            {
                var equiposRotacion = equiposConfirmados.Select(idEquipo => (int?)idEquipo).ToList();
                if (equiposRotacion.Count % 2 != 0)
                    equiposRotacion.Add(null);

                var totalEquipos = equiposRotacion.Count;
                var totalJornadas = totalEquipos - 1;
                var partidosPorJornada = totalEquipos / 2;

                for (var ronda = 0; ronda < totalJornadas; ronda++)
                {
                    var fechaDesde = inicio.AddDays(ronda * 7);
                    var fixture = new Fixture
                    {
                        Numero = jornada,
                        TorneoId = torneo.Id,
                        FechaDesde = fechaDesde,
                        FechaHasta = fechaDesde.AddDays(6)
                    };

                    for (var i = 0; i < partidosPorJornada; i++)
                    {
                        var local = equiposRotacion[i];
                        var visitante = equiposRotacion[totalEquipos - 1 - i];

                        if (!local.HasValue || !visitante.HasValue)
                            continue;

                        var invertir = ronda % 2 == 1;
                        fixture.Partidos.Add(new Partido
                        {
                            TorneoId = torneo.Id,
                            EquipoLocalId = invertir ? visitante.Value : local.Value,
                            EquipoVisitanteId = invertir ? local.Value : visitante.Value,
                            FechaHora = fechaDesde.AddHours(i * 2),
                            Estado = "Programado"
                        });
                    }

                    if (fixture.Partidos.Count > 0)
                    {
                        fixtures.Add(fixture);
                        jornada++;
                    }

                    var ultimo = equiposRotacion[^1];
                    for (var i = totalEquipos - 1; i > 1; i--)
                        equiposRotacion[i] = equiposRotacion[i - 1];
                    equiposRotacion[1] = ultimo;
                }
            }
            else
            {
                // Eliminación directa
                for (var i = 0; i < equiposConfirmados.Count; i += 2)
                {
                    if (i + 1 >= equiposConfirmados.Count) break;
                    var fechaDesde = inicio.AddDays((jornada - 1) * 7);
                    var fixture = new Fixture
                    {
                        Numero     = jornada,
                        TorneoId   = torneo.Id,
                        FechaDesde = fechaDesde,
                        FechaHasta = fechaDesde.AddDays(6)
                    };
                    fixture.Partidos.Add(new Partido
                    {
                        TorneoId          = torneo.Id,
                        EquipoLocalId     = equiposConfirmados[i],
                        EquipoVisitanteId = equiposConfirmados[i + 1],
                        FechaHora         = fechaDesde,
                        Estado            = "Programado"
                    });
                    fixtures.Add(fixture);
                    jornada++;
                }
            }

            _context.Fixtures.AddRange(fixtures);
            torneo.Estado = "En curso";
            await _context.SaveChangesAsync();

            return Ok(new
            {
                totalJornadas    = fixtures.Count,
                totalPartidos    = fixtures.Sum(f => f.Partidos.Count),
                equiposIncluidos = equiposConfirmados.Count,
                modalidad        = esTodosVsTodos ? "TodosVsTodos" : "Eliminacion",
                fixtures         = fixtures.Select(f => new { f.Numero, f.FechaDesde, f.FechaHasta, Partidos = f.Partidos.Count })
            });
        }

        [HttpPut("partidos/{partidoId}/resultado")]
        public async Task<IActionResult> RegistrarResultado(int partidoId, [FromBody] ResultadoRequest request)
        {
            var partido = await _context.Partidos.FindAsync(partidoId);
            if (partido == null) return NotFound("Partido no encontrado");

            partido.GolesLocal     = request.GolesLocal;
            partido.GolesVisitante = request.GolesVisitante;
            partido.Estado         = "Finalizado";

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
            public DateTime FechaInicio { get; set; }
            public DateTime FechaFin { get; set; }
            public string Categoria { get; set; } = "Primera";
            public int PremioUSD { get; set; } = 0;
            public string Modalidad { get; set; } = "Eliminacion";
            public decimal CostoInscripcion { get; set; } = 0;
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
