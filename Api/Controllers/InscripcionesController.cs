using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    /// <summary>
    /// Gestiona la inscripción de equipos a Ligas y Torneos.
    /// El flujo es: inscribir → se genera un Cobro pendiente → el equipo paga → Estado pasa a "Confirmado".
    /// Solo los equipos con Estado="Confirmado" participan en el fixture.
    /// </summary>
    [Route("api/v1")]
    [ApiController]
    public class InscripcionesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public InscripcionesController(AppDbContext context)
        {
            _context = context;
        }

        // ── LIGAS ────────────────────────────────────────────────────────────

        /// <summary>
        /// Inscribe un equipo en una liga y genera el cobro de la matrícula.
        /// </summary>
        [HttpPost("ligas/{ligaId}/inscribir")]
        public async Task<IActionResult> InscribirEnLiga(int ligaId, [FromBody] InscripcionRequest request)
        {
            var liga = await _context.Ligas
                .Include(l => l.Inscripciones)
                .FirstOrDefaultAsync(l => l.Id == ligaId);

            if (liga == null) return NotFound("Liga no encontrada");
            if (liga.Estado != "Abierta") return BadRequest("La liga no está abierta para inscripciones");

            var equiposConfirmados = liga.Inscripciones.Count(i => i.Estado == "Confirmado");
            if (equiposConfirmados >= liga.CupoEquipos)
                return BadRequest("Cupo de liga agotado");

            // Resolver o crear equipo
            var equipo = await ResolverEquipo(request);
            if (equipo == null) return BadRequest("Equipo no encontrado o datos insuficientes para crearlo");

            if (liga.Inscripciones.Any(i => i.EquipoId == equipo.Id))
                return BadRequest("Este equipo ya está inscripto en la liga");

            // Crear cobro por la matrícula
            var cobro = new Cobro
            {
                Concepto = $"Matrícula Liga '{liga.Nombre}' - Equipo '{equipo.Nombre}'",
                Monto = liga.CostoInscripcion,
                Descuento = 0,
                MontoFinal = liga.CostoInscripcion,
                Estado = "Pendiente",
                MetodoPago = string.Empty,
                Fecha = DateTime.UtcNow
            };
            _context.Cobros.Add(cobro);
            await _context.SaveChangesAsync();

            // Crear inscripción vinculada al cobro
            var inscripcion = new InscripcionLiga
            {
                LigaId = ligaId,
                EquipoId = equipo.Id,
                Estado = liga.CostoInscripcion > 0 ? "Pendiente" : "Confirmado",
                CobroId = cobro.Id
            };
            _context.InscripcionesLiga.Add(inscripcion);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                inscripcion.Id,
                EquipoId = equipo.Id,
                EquipoNombre = equipo.Nombre,
                LigaId = ligaId,
                LigaNombre = liga.Nombre,
                cobroId = cobro.Id,
                montoMatricula = cobro.MontoFinal,
                estado = inscripcion.Estado,
                mensaje = liga.CostoInscripcion > 0
                    ? "Inscripción registrada. Completá el pago para confirmar tu lugar."
                    : "Inscripción confirmada automáticamente (sin costo)."
            });
        }

        /// <summary>
        /// Lista los equipos inscriptos en una liga con su estado de pago.
        /// </summary>
        [HttpGet("ligas/{ligaId}/inscritos")]
        public async Task<IActionResult> GetInscritosLiga(int ligaId)
        {
            var inscritos = await _context.InscripcionesLiga
                .Where(i => i.LigaId == ligaId)
                .Include(i => i.Equipo).ThenInclude(e => e.Jugadores)
                .Include(i => i.Cobro)
                .Select(i => new
                {
                    i.Id,
                    i.EquipoId,
                    EquipoNombre = i.Equipo.Nombre,
                    Capitan = i.Equipo.Capitan == null ? null : $"{i.Equipo.Capitan.Nombre} {i.Equipo.Capitan.Apellido}",
                    Jugadores = i.Equipo.Jugadores.Count,
                    i.Estado,
                    i.FechaInscripcion,
                    Cobro = i.Cobro == null ? null : new
                    {
                        i.Cobro.Id,
                        i.Cobro.MontoFinal,
                        i.Cobro.Estado
                    }
                })
                .ToListAsync();

            return Ok(inscritos);
        }

        // ── TORNEOS ──────────────────────────────────────────────────────────

        /// <summary>
        /// Inscribe un equipo en un torneo y genera el cobro de la matrícula.
        /// </summary>
        [HttpPost("torneos/{torneoId}/inscribir")]
        public async Task<IActionResult> InscribirEnTorneo(int torneoId, [FromBody] InscripcionRequest request)
        {
            var torneo = await _context.Torneos
                .Include(t => t.Inscripciones)
                .FirstOrDefaultAsync(t => t.Id == torneoId);

            if (torneo == null) return NotFound("Torneo no encontrado");
            if (torneo.Estado != "Abierto") return BadRequest("El torneo no está abierto para inscripciones");

            var equiposConfirmados = torneo.Inscripciones.Count(i => i.Estado == "Confirmado");
            if (equiposConfirmados >= torneo.CupoEquipos)
                return BadRequest("Cupo de torneo agotado");

            var equipo = await ResolverEquipo(request);
            if (equipo == null) return BadRequest("Equipo no encontrado o datos insuficientes para crearlo");

            if (torneo.Inscripciones.Any(i => i.EquipoId == equipo.Id))
                return BadRequest("Este equipo ya está inscripto en el torneo");

            var cobro = new Cobro
            {
                Concepto = $"Matrícula Torneo '{torneo.Nombre}' - Equipo '{equipo.Nombre}'",
                Monto = torneo.CostoInscripcion,
                Descuento = 0,
                MontoFinal = torneo.CostoInscripcion,
                Estado = "Pendiente",
                MetodoPago = string.Empty,
                Fecha = DateTime.UtcNow
            };
            _context.Cobros.Add(cobro);
            await _context.SaveChangesAsync();

            var inscripcion = new InscripcionTorneo
            {
                TorneoId = torneoId,
                EquipoId = equipo.Id,
                Estado = torneo.CostoInscripcion > 0 ? "Pendiente" : "Confirmado",
                CobroId = cobro.Id
            };
            _context.InscripcionesTorneo.Add(inscripcion);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                inscripcion.Id,
                EquipoId = equipo.Id,
                EquipoNombre = equipo.Nombre,
                TorneoId = torneoId,
                TorneoNombre = torneo.Nombre,
                cobroId = cobro.Id,
                montoMatricula = cobro.MontoFinal,
                estado = inscripcion.Estado,
                mensaje = torneo.CostoInscripcion > 0
                    ? "Inscripción registrada. Completá el pago para confirmar tu lugar."
                    : "Inscripción confirmada automáticamente (sin costo)."
            });
        }

        /// <summary>
        /// Lista los equipos inscriptos en un torneo con su estado de pago.
        /// </summary>
        [HttpGet("torneos/{torneoId}/inscritos")]
        public async Task<IActionResult> GetInscritosTorneo(int torneoId)
        {
            var inscritos = await _context.InscripcionesTorneo
                .Where(i => i.TorneoId == torneoId)
                .Include(i => i.Equipo).ThenInclude(e => e.Jugadores)
                .Include(i => i.Cobro)
                .Select(i => new
                {
                    i.Id,
                    i.EquipoId,
                    EquipoNombre = i.Equipo.Nombre,
                    Capitan = i.Equipo.Capitan == null ? null : $"{i.Equipo.Capitan.Nombre} {i.Equipo.Capitan.Apellido}",
                    Jugadores = i.Equipo.Jugadores.Count,
                    i.Estado,
                    i.FechaInscripcion,
                    Cobro = i.Cobro == null ? null : new
                    {
                        i.Cobro.Id,
                        i.Cobro.MontoFinal,
                        i.Cobro.Estado
                    }
                })
                .ToListAsync();

            return Ok(inscritos);
        }

        // ── HELPERS ──────────────────────────────────────────────────────────

        /// <summary>
        /// Si se provee EquipoId, usa el equipo existente.
        /// Si se provee NombreEquipo, crea uno nuevo con el capitán indicado.
        /// </summary>
        private async Task<Equipo?> ResolverEquipo(InscripcionRequest request)
        {
            if (request.EquipoId.HasValue)
                return await _context.Equipos.FindAsync(request.EquipoId.Value);

            if (string.IsNullOrWhiteSpace(request.NombreEquipo))
                return null;

            var nombreEquipo = request.NombreEquipo.Trim();
            var nombreNormalizado = nombreEquipo.ToLower();
            var equipoExistente = await _context.Equipos
                .FirstOrDefaultAsync(e => e.Nombre.ToLower() == nombreNormalizado);

            if (equipoExistente != null)
                return equipoExistente;

            var equipo = new Equipo
            {
                Nombre = nombreEquipo,
                Categoria = request.Categoria ?? "Primera",
                Estado = "Activo",
                CapitanId = request.CapitanId
            };
            _context.Equipos.Add(equipo);
            await _context.SaveChangesAsync();

            // Agregar jugadores si se proporcionan
            if (request.JugadoresIds != null && request.JugadoresIds.Any())
            {
                var equiloConJugadores = await _context.Equipos
                    .Include(e => e.Jugadores)
                    .FirstAsync(e => e.Id == equipo.Id);

                foreach (var uid in request.JugadoresIds)
                {
                    var u = await _context.Usuarios.FindAsync(uid);
                    if (u != null) equiloConJugadores.Jugadores.Add(u);
                }
                await _context.SaveChangesAsync();
            }

            return equipo;
        }

        // ── REQUEST DTOs ─────────────────────────────────────────────────────

        public class InscripcionRequest
        {
            /// <summary>ID de un equipo existente. Si se provee, se omiten los campos de creación.</summary>
            public int? EquipoId { get; set; }

            /// <summary>Nombre del nuevo equipo (usado solo si EquipoId es null).</summary>
            public string? NombreEquipo { get; set; }
            public string? Categoria { get; set; }
            public int? CapitanId { get; set; }
            public List<int>? JugadoresIds { get; set; }
        }
    }
}
