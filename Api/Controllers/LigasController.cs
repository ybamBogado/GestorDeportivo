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
                    l.FechaInicio,
                    l.FechaFin,
                    l.Categoria,
                    l.CantidadFechas,
                    l.CostoInscripcion,
                    EquiposConfirmados = l.Inscripciones.Count(i => i.Estado == "Confirmado"),
                    EquiposPendientes  = l.Inscripciones.Count(i => i.Estado == "Pendiente"),
                    Partidos           = l.Partidos.Count
                })
                .ToListAsync();

            return Ok(ligas);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var liga = await _context.Ligas
                .Include(l => l.Inscripciones).ThenInclude(i => i.Equipo)
                .Include(l => l.Inscripciones).ThenInclude(i => i.Cobro)
                .Include(l => l.Partidos).ThenInclude(p => p.EquipoLocal)
                .Include(l => l.Partidos).ThenInclude(p => p.EquipoVisitante)
                .Include(l => l.Fixtures)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (liga == null) return NotFound("Liga no encontrada");
            return Ok(liga);
        }

        /// <summary>GET /ligas/{id}/fixtures — devuelve las jornadas con sus partidos</summary>
        [HttpGet("{id}/fixtures")]
        public async Task<IActionResult> GetFixtures(int id)
        {
            if (!await _context.Ligas.AnyAsync(l => l.Id == id))
                return NotFound("Liga no encontrada");

            var fixtures = await _context.Fixtures
                .Where(f => f.LigaId == id)
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
        public async Task<IActionResult> Create([FromBody] LigaRequest request)
        {
            var liga = new Liga
            {
                Nombre           = request.Nombre,
                Reglamento       = request.Reglamento,
                Estado           = string.IsNullOrWhiteSpace(request.Estado) ? "Abierta" : request.Estado,
                CupoEquipos      = request.CupoEquipos <= 0 ? 16 : request.CupoEquipos,
                ComplejoId       = request.ComplejoId,
                FechaInicio      = request.FechaInicio == default ? DateTime.UtcNow : request.FechaInicio,
                FechaFin         = request.FechaFin == default ? DateTime.UtcNow.AddMonths(3) : request.FechaFin,
                CantidadFechas   = request.CantidadFechas <= 0 ? 1 : request.CantidadFechas,
                Categoria        = string.IsNullOrWhiteSpace(request.Categoria) ? "Primera" : request.Categoria,
                CostoInscripcion = request.CostoInscripcion < 0 ? 0 : request.CostoInscripcion
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

            liga.Nombre      = request.Nombre;
            liga.Reglamento  = request.Reglamento;
            liga.Estado      = string.IsNullOrWhiteSpace(request.Estado) ? liga.Estado : request.Estado;
            liga.CupoEquipos = request.CupoEquipos <= 0 ? liga.CupoEquipos : request.CupoEquipos;
            liga.ComplejoId  = request.ComplejoId;
            if (request.FechaInicio != default)    liga.FechaInicio     = request.FechaInicio;
            if (request.FechaFin != default)       liga.FechaFin        = request.FechaFin;
            if (request.CantidadFechas > 0)        liga.CantidadFechas  = request.CantidadFechas;
            if (!string.IsNullOrWhiteSpace(request.Categoria)) liga.Categoria = request.Categoria;
            if (request.CostoInscripcion >= 0)     liga.CostoInscripcion = request.CostoInscripcion;

            await _context.SaveChangesAsync();
            return Ok(liga);
        }

        /// <summary>
        /// Genera el fixture para la liga.
        /// SOLO incluye equipos con Estado="Confirmado" (inscripción pagada).
        /// </summary>
        [HttpPost("{id}/fixture")]
        public async Task<IActionResult> GenerarFixture(int id, [FromBody] FixtureRequest? request)
        {
            var liga = await _context.Ligas
                .Include(l => l.Inscripciones)
                .Include(l => l.Partidos)
                .Include(l => l.Fixtures)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (liga == null) return NotFound("Liga no encontrada");
            if (liga.Fixtures.Any()) return BadRequest("La liga ya tiene fixture generado");

            // Solo equipos que pagaron
            var equiposConfirmados = liga.Inscripciones
                .Where(i => i.Estado == "Confirmado")
                .Select(i => i.EquipoId)
                .ToList();

            if (equiposConfirmados.Count < 2)
                return BadRequest("Se necesitan al menos 2 equipos con inscripción confirmada (pagada) para generar el fixture");

            var inicio = request?.FechaInicio ?? DateTime.UtcNow.Date.AddDays(7);
            var fixtures = new List<Fixture>();
            var equiposRotacion = equiposConfirmados.Select(id => (int?)id).ToList();
            if (equiposRotacion.Count % 2 != 0)
                equiposRotacion.Add(null);

            var totalEquipos = equiposRotacion.Count;
            var totalJornadas = totalEquipos - 1;
            var partidosPorJornada = totalEquipos / 2;

            for (var jornada = 0; jornada < totalJornadas; jornada++)
            {
                var fechaDesde = inicio.AddDays(jornada * 7);
                var fixture = new Fixture
                {
                    Numero = jornada + 1,
                    LigaId = liga.Id,
                    FechaDesde = fechaDesde,
                    FechaHasta = fechaDesde.AddDays(6),
                };

                for (var i = 0; i < partidosPorJornada; i++)
                {
                    var local = equiposRotacion[i];
                    var visitante = equiposRotacion[totalEquipos - 1 - i];

                    if (!local.HasValue || !visitante.HasValue)
                        continue;

                    var invertir = jornada % 2 == 1;
                    fixture.Partidos.Add(new Partido
                    {
                        LigaId = liga.Id,
                        EquipoLocalId = invertir ? visitante.Value : local.Value,
                        EquipoVisitanteId = invertir ? local.Value : visitante.Value,
                        FechaHora = fechaDesde.AddHours(i * 2),
                        Estado = "Programado"
                    });
                }

                if (fixture.Partidos.Count > 0)
                    fixtures.Add(fixture);

                var ultimo = equiposRotacion[^1];
                for (var i = totalEquipos - 1; i > 1; i--)
                    equiposRotacion[i] = equiposRotacion[i - 1];
                equiposRotacion[1] = ultimo;
            }

            _context.Fixtures.AddRange(fixtures);
            liga.Estado = "En curso";
            await _context.SaveChangesAsync();

            return Ok(new
            {
                totalJornadas    = fixtures.Count,
                totalPartidos    = fixtures.Sum(f => f.Partidos.Count),
                equiposIncluidos = equiposConfirmados.Count,
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
            public DateTime FechaInicio { get; set; }
            public DateTime FechaFin { get; set; }
            public int CantidadFechas { get; set; } = 1;
            public string Categoria { get; set; } = "Primera";
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
