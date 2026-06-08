using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
