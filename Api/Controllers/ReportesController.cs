using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace Api.Controllers
{
    /// <summary>
    /// RF-35, RF-55..58: Generación de reportes de ingresos, reservas y asistencia.
    /// </summary>
    [Route("api/v1/reportes")]
    [ApiController]
    public class ReportesController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ReportesController(AppDbContext context) => _context = context;

        // ─────────────────────────────────────────────────────────────────────
        // RF-35: Reporte de ingresos
        // ─────────────────────────────────────────────────────────────────────

        /// <summary>GET api/v1/reportes/ingresos — Ingresos por período.</summary>
        [HttpGet("ingresos")]
        public async Task<IActionResult> Ingresos(
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta)
        {
            desde ??= DateTime.UtcNow.AddMonths(-1);
            hasta ??= DateTime.UtcNow;

            var cobros = await _context.Cobros
                .Include(c => c.Reserva)
                .Where(c => c.Estado == "Pagado"
                         && c.Fecha >= desde
                         && c.Fecha <= hasta)
                .ToListAsync();

            var totalIngresos    = cobros.Sum(c => c.MontoFinal);
            var porMetodo        = cobros
                .GroupBy(c => string.IsNullOrWhiteSpace(c.MetodoPago) ? "Sin especificar" : c.MetodoPago)
                .Select(g => new { metodo = g.Key, total = g.Sum(c => c.MontoFinal), cantidad = g.Count() })
                .ToList();
            var porDia           = cobros
                .GroupBy(c => c.Fecha.Date)
                .OrderBy(g => g.Key)
                .Select(g => new { fecha = g.Key.ToString("yyyy-MM-dd"), total = g.Sum(c => c.MontoFinal) })
                .ToList();

            return Ok(new
            {
                desde        = desde.Value.ToString("yyyy-MM-dd"),
                hasta        = hasta.Value.ToString("yyyy-MM-dd"),
                totalIngresos,
                cantidadCobros = cobros.Count,
                promedioTicket = cobros.Count > 0 ? Math.Round(totalIngresos / cobros.Count, 2) : 0,
                porMetodoPago  = porMetodo,
                evolucionDiaria = porDia
            });
        }

        /// <summary>GET api/v1/reportes/ingresos/export — Exporta ingresos como CSV.</summary>
        [HttpGet("ingresos/export")]
        public async Task<IActionResult> ExportIngresos(
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta)
        {
            desde ??= DateTime.UtcNow.AddMonths(-1);
            hasta ??= DateTime.UtcNow;

            var cobros = await _context.Cobros
                .Include(c => c.Reserva)
                .Where(c => c.Estado == "Pagado"
                         && c.Fecha >= desde
                         && c.Fecha <= hasta)
                .OrderBy(c => c.Fecha)
                .ToListAsync();

            var sb = new StringBuilder();
            sb.AppendLine("ID,Fecha,Concepto,MetodoPago,Monto,Descuento,MontoFinal,ReservaId");
            foreach (var c in cobros)
                sb.AppendLine($"{c.Id},{c.Fecha:yyyy-MM-dd HH:mm},\"{c.Concepto}\",{c.MetodoPago},{c.Monto},{c.Descuento},{c.MontoFinal},{c.ReservaId}");

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", $"ingresos_{desde:yyyyMMdd}_{hasta:yyyyMMdd}.csv");
        }

        // ─────────────────────────────────────────────────────────────────────
        // RF-58: Reporte de reservas
        // ─────────────────────────────────────────────────────────────────────

        /// <summary>GET api/v1/reportes/reservas — Estadísticas de reservas.</summary>
        [HttpGet("reservas")]
        public async Task<IActionResult> ReportesReservas(
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta)
        {
            desde ??= DateTime.UtcNow.AddMonths(-1);
            hasta ??= DateTime.UtcNow;

            var reservas = await _context.Reservas
                .Include(r => r.Cancha)
                .Include(r => r.Persona)
                .Where(r => r.Fecha >= desde.Value.Date && r.Fecha <= hasta.Value.Date)
                .ToListAsync();

            var porEstado  = reservas.GroupBy(r => r.Estado)
                .Select(g => new { estado = g.Key, cantidad = g.Count() });
            var porCancha  = reservas.GroupBy(r => r.CanchaId)
                .Select(g => new
                {
                    canchaId   = g.Key,
                    tipCancha  = g.First().Cancha?.GetType().Name ?? "N/A",
                    cantidad   = g.Count(),
                    confirmadas = g.Count(r => r.Estado == "Confirmada"),
                    canceladas  = g.Count(r => r.Estado == "Cancelada")
                });

            return Ok(new
            {
                desde    = desde.Value.ToString("yyyy-MM-dd"),
                hasta    = hasta.Value.ToString("yyyy-MM-dd"),
                total    = reservas.Count,
                pagadas  = reservas.Count(r => r.Pago),
                porEstado,
                porCancha,
                tasaOcupacion = reservas.Count > 0
                    ? Math.Round((double)reservas.Count(r => r.Estado == "Confirmada") / reservas.Count * 100, 1)
                    : 0
            });
        }

        /// <summary>GET api/v1/reportes/reservas/export — Exporta reservas como CSV.</summary>
        [HttpGet("reservas/export")]
        public async Task<IActionResult> ExportReservas(
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta)
        {
            desde ??= DateTime.UtcNow.AddMonths(-1);
            hasta ??= DateTime.UtcNow;

            var reservas = await _context.Reservas
                .Include(r => r.Cancha)
                .Include(r => r.Persona)
                .Where(r => r.Fecha >= desde.Value.Date && r.Fecha <= hasta.Value.Date)
                .OrderBy(r => r.Fecha).ThenBy(r => r.HoraInicio)
                .ToListAsync();

            var sb = new StringBuilder();
            sb.AppendLine("ID,Fecha,HoraInicio,HoraFin,CanchaId,TipoCancha,PersonaId,NombrePersona,Estado,Pago,Precio");
            foreach (var r in reservas)
            {
                var nombre = r.Persona != null ? $"{r.Persona.Nombre} {r.Persona.Apellido}" : "N/A";
                sb.AppendLine($"{r.Id},{r.Fecha:yyyy-MM-dd},{r.HoraInicio:hh\\:mm},{r.HoraFin:hh\\:mm},{r.CanchaId},{r.Cancha?.GetType().Name ?? "N/A"},{r.PersonaId},\"{nombre}\",{r.Estado},{r.Pago},{r.Precio}");
            }

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", $"reservas_{desde:yyyyMMdd}_{hasta:yyyyMMdd}.csv");
        }

        // ─────────────────────────────────────────────────────────────────────
        // RF-55..57: Reporte de asistencia a clases
        // ─────────────────────────────────────────────────────────────────────

        /// <summary>GET api/v1/reportes/asistencia — Asistencia a clases.</summary>
        [HttpGet("asistencia")]
        public async Task<IActionResult> ReporteAsistencia(
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta,
            [FromQuery] int? claseId)
        {
            desde ??= DateTime.UtcNow.AddMonths(-1);
            hasta ??= DateTime.UtcNow;

            var query = _context.Asistencias
                .Include(a => a.Clase)
                .Include(a => a.Usuario)
                .Where(a => a.Clase.FechaHora >= desde && a.Clase.FechaHora <= hasta);

            if (claseId.HasValue)
                query = query.Where(a => a.ClaseId == claseId.Value);

            var asistencias = await query.ToListAsync();

            var porClase = asistencias.GroupBy(a => a.ClaseId)
                .Select(g => new
                {
                    claseId    = g.Key,
                    nombreClase = g.First().Clase?.Tipo ?? "N/A",
                    total      = g.Count(),
                    presentes  = g.Count(a => a.Presente),
                    ausentes   = g.Count(a => !a.Presente),
                    tasaAsistencia = g.Count() > 0
                        ? Math.Round((double)g.Count(a => a.Presente) / g.Count() * 100, 1)
                        : 0.0
                });

            return Ok(new
            {
                desde    = desde.Value.ToString("yyyy-MM-dd"),
                hasta    = hasta.Value.ToString("yyyy-MM-dd"),
                totalRegistros = asistencias.Count,
                totalPresentes = asistencias.Count(a => a.Presente),
                porClase
            });
        }

        /// <summary>GET api/v1/reportes/asistencia/export — Exporta asistencia como CSV.</summary>
        [HttpGet("asistencia/export")]
        public async Task<IActionResult> ExportAsistencia(
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta)
        {
            desde ??= DateTime.UtcNow.AddMonths(-1);
            hasta ??= DateTime.UtcNow;

            var asistencias = await _context.Asistencias
                .Include(a => a.Clase)
                .Include(a => a.Usuario)
                .Where(a => a.Clase.FechaHora >= desde && a.Clase.FechaHora <= hasta)
                .OrderBy(a => a.Clase.FechaHora)
                .ToListAsync();

            var sb = new StringBuilder();
            sb.AppendLine("ClaseId,NombreClase,Fecha,UsuarioId,NombreUsuario,Presente");
            foreach (var a in asistencias)
            {
                var alumno = a.Usuario != null ? $"{a.Usuario.Nombre} {a.Usuario.Apellido}" : "N/A";
                sb.AppendLine($"{a.ClaseId},\"{a.Clase?.Tipo}\",{a.Clase?.FechaHora:yyyy-MM-dd HH:mm},{a.UsuarioId},\"{alumno}\",{a.Presente}");
            }

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", $"asistencia_{desde:yyyyMMdd}_{hasta:yyyyMMdd}.csv");
        }

        // ─────────────────────────────────────────────────────────────────────
        // RF-11: Reporte de tipos de canchas
        // ─────────────────────────────────────────────────────────────────────

        /// <summary>GET api/v1/reportes/canchas — Uso de canchas.</summary>
        [HttpGet("canchas")]
        public async Task<IActionResult> ReporteCanchas([FromQuery] DateTime? desde, [FromQuery] DateTime? hasta)
        {
            desde ??= DateTime.UtcNow.AddMonths(-1);
            hasta ??= DateTime.UtcNow;

            var canchas = await _context.Canchas
                .Include(c => c.Reservas)
                .ToListAsync();

            var resultado = canchas.Select(c => new
            {
                id             = c.Id,
                tipo           = c.GetType().Name,
                superficie     = c.Superficie,
                estado         = c.Estado,
                duracionMaxima = c.GetDuracionMaxima(),
                totalReservas  = c.Reservas.Count(r => r.Fecha >= desde.Value.Date && r.Fecha <= hasta.Value.Date),
                confirmadas    = c.Reservas.Count(r => r.Estado == "Confirmada" && r.Fecha >= desde.Value.Date && r.Fecha <= hasta.Value.Date),
                canceladas     = c.Reservas.Count(r => r.Estado == "Cancelada" && r.Fecha >= desde.Value.Date && r.Fecha <= hasta.Value.Date),
                ingresoTotal   = c.Reservas.Where(r => r.Pago && r.Fecha >= desde.Value.Date && r.Fecha <= hasta.Value.Date).Sum(r => r.Precio)
            });

            return Ok(new { desde = desde.Value.ToString("yyyy-MM-dd"), hasta = hasta.Value.ToString("yyyy-MM-dd"), canchas = resultado });
        }

        // ─────────────────────────────────────────────────────────────────────
        // RF-05/27/32: Exportar datos de usuarios, cobros, recibos
        // ─────────────────────────────────────────────────────────────────────

        /// <summary>GET api/v1/reportes/usuarios/export — Exporta datos de usuarios como CSV.</summary>
        [HttpGet("usuarios/export")]
        public async Task<IActionResult> ExportUsuarios()
        {
            var personas = await _context.Personas.OrderBy(p => p.Apellido).ToListAsync();

            var sb = new StringBuilder();
            sb.AppendLine("ID,Nombre,Apellido,Email,Rol,DNI,Legajo");
            foreach (var p in personas)
                sb.AppendLine($"{p.Id},\"{p.Nombre}\",\"{p.Apellido}\",{p.Email},{p.Rol},{p.Dni},{p.Legajo}");

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", "usuarios.csv");
        }

        /// <summary>GET api/v1/reportes/cobros/export — Exporta cobros como CSV.</summary>
        [HttpGet("cobros/export")]
        public async Task<IActionResult> ExportCobros(
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta)
        {
            desde ??= DateTime.UtcNow.AddMonths(-1);
            hasta ??= DateTime.UtcNow;

            var cobros = await _context.Cobros
                .Where(c => c.Fecha >= desde && c.Fecha <= hasta)
                .OrderBy(c => c.Fecha)
                .ToListAsync();

            var sb = new StringBuilder();
            sb.AppendLine("ID,Fecha,Concepto,Monto,Descuento,MontoFinal,Estado,MetodoPago,ReservaId");
            foreach (var c in cobros)
                sb.AppendLine($"{c.Id},{c.Fecha:yyyy-MM-dd HH:mm},\"{c.Concepto}\",{c.Monto},{c.Descuento},{c.MontoFinal},{c.Estado},{c.MetodoPago},{c.ReservaId}");

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", $"cobros_{desde:yyyyMMdd}_{hasta:yyyyMMdd}.csv");
        }

        /// <summary>GET api/v1/reportes/recibos/export — Exporta recibos como CSV.</summary>
        [HttpGet("recibos/export")]
        public async Task<IActionResult> ExportRecibos()
        {
            var recibos = await _context.Recibos
                .Include(r => r.Cobro)
                .OrderByDescending(r => r.FechaEmision)
                .ToListAsync();

            var sb = new StringBuilder();
            sb.AppendLine("ID,Numero,FechaEmision,CobroId,Monto,Datos");
            foreach (var r in recibos)
                sb.AppendLine($"{r.Id},{r.Numero},{r.FechaEmision:yyyy-MM-dd HH:mm},{r.CobroId},{r.Cobro?.MontoFinal},\"{r.Datos}\"");

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", "recibos.csv");
        }
    }
}
