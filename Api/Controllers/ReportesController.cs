using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Api.Controllers
{
    [Route("api/v1/reportes")]
    [ApiController]
    public class ReportesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReportesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("ingresos")]
        public async Task<IActionResult> GetIngresosReport([FromQuery] DateTime desde, [FromQuery] DateTime hasta)
        {
            // Set end date to end of the day (23:59:59) to include all events on that day
            var fechaHastaFinDia = hasta.Date.AddDays(1).AddTicks(-1);

            var cobros = await _context.Cobros
                .Where(c => c.Estado == "Pagado" && c.Fecha >= desde && c.Fecha <= fechaHastaFinDia)
                .OrderBy(c => c.Fecha)
                .ToListAsync();

            var totalMontoOriginal = cobros.Sum(c => c.Monto);
            var totalDescuento = cobros.Sum(c => c.Descuento);
            var totalMontoFinal = cobros.Sum(c => c.MontoFinal);

            // Group by category based on Concepto
            var porCategoria = cobros.GroupBy(c => {
                var conceptoLower = c.Concepto.ToLower();
                if (conceptoLower.Contains("cancha") || conceptoLower.Contains("reserva")) return "Canchas";
                if (conceptoLower.Contains("clase")) return "Clases";
                if (conceptoLower.Contains("entrenamiento")) return "Entrenamientos";
                if (conceptoLower.Contains("liga")) return "Ligas";
                if (conceptoLower.Contains("torneo")) return "Torneos";
                return "Otros";
            })
            .Select(g => new { Categoria = g.Key, Total = g.Sum(c => c.MontoFinal) })
            .ToList();

            // Group by payment method
            var porMetodoPago = cobros.GroupBy(c => string.IsNullOrWhiteSpace(c.MetodoPago) ? "No especificado" : c.MetodoPago)
                .Select(g => new { MetodoPago = g.Key, Total = g.Sum(c => c.MontoFinal) })
                .ToList();

            return Ok(new
            {
                desde,
                hasta = fechaHastaFinDia,
                totalMontoOriginal,
                totalDescuento,
                totalMontoFinal,
                porCategoria,
                porMetodoPago,
                transacciones = cobros.Select(c => new
                {
                    c.Id,
                    c.Fecha,
                    c.Concepto,
                    c.Monto,
                    c.Descuento,
                    c.MontoFinal,
                    MetodoPago = string.IsNullOrWhiteSpace(c.MetodoPago) ? "—" : c.MetodoPago
                })
            });
        }

        [HttpGet("asistencia")]
        public async Task<IActionResult> GetAsistenciaReport([FromQuery] DateTime desde, [FromQuery] DateTime hasta)
        {
            var fechaHastaFinDia = hasta.Date.AddDays(1).AddTicks(-1);

            // Fetch all non-cancelled classes with attendees
            var clases = await _context.Clases
                .Include(c => c.Profesor)
                .Include(c => c.Cancha)
                .Include(c => c.Asistencias)
                    .ThenInclude(a => a.Usuario)
                .Where(c => c.FechaHora >= desde && c.FechaHora <= fechaHastaFinDia && c.Estado != "Cancelada")
                .ToListAsync();

            // Fetch all non-cancelled training sessions with attendees
            var entrenamientos = await _context.Entrenamientos
                .Include(e => e.Profesor)
                .Include(e => e.Cancha)
                .Include(e => e.Inscripciones)
                    .ThenInclude(i => i.Usuario)
                .Where(e => e.Fecha >= desde && e.Fecha <= fechaHastaFinDia && e.Estado != "Cancelado")
                .ToListAsync();

            var listaClases = clases.Select(c =>
            {
                var totalInscriptos = c.Asistencias.Count;
                var presentes = c.Asistencias.Count(a => a.Presente);
                var ausentes = totalInscriptos - presentes;
                double tasaAsistencia = totalInscriptos > 0 ? (double)presentes / totalInscriptos * 100 : 0;
                return new
                {
                    c.Id,
                    Tipo = "Clase",
                    Nombre = c.Tipo,
                    Fecha = c.FechaHora,
                    Instructor = $"{c.Profesor.Nombre} {c.Profesor.Apellido}",
                    Cancha = c.Cancha.Superficie,
                    Capacidad = c.CapacidadMax,
                    Inscriptos = totalInscriptos,
                    Presentes = presentes,
                    Ausentes = ausentes,
                    TasaAsistencia = Math.Round(tasaAsistencia, 1),
                    Alumnos = c.Asistencias.Select(a => new
                    {
                        a.Usuario.Id,
                        NombreCompleto = $"{a.Usuario.Nombre} {a.Usuario.Apellido}",
                        a.Presente
                    }).ToList()
                };
            }).ToList();

            var listaEntrenamientos = entrenamientos.Select(e =>
            {
                var confirmedInscripciones = e.Inscripciones.Where(i => i.Estado == "Confirmado").ToList();
                var totalInscriptos = confirmedInscripciones.Count;
                var presentes = confirmedInscripciones.Count(i => i.Presente);
                var ausentes = totalInscriptos - presentes;
                double tasaAsistencia = totalInscriptos > 0 ? (double)presentes / totalInscriptos * 100 : 0;
                return new
                {
                    e.Id,
                    Tipo = "Entrenamiento",
                    Nombre = e.Tipo,
                    Fecha = e.Fecha,
                    Instructor = $"{e.Profesor.Nombre} {e.Profesor.Apellido}",
                    Cancha = e.Cancha.Superficie,
                    Capacidad = 20, // default / assumed
                    Inscriptos = totalInscriptos,
                    Presentes = presentes,
                    Ausentes = ausentes,
                    TasaAsistencia = Math.Round(tasaAsistencia, 1),
                    Alumnos = confirmedInscripciones.Select(i => new
                    {
                        i.Usuario.Id,
                        NombreCompleto = $"{i.Usuario.Nombre} {i.Usuario.Apellido}",
                        i.Presente
                    }).ToList()
                };
            }).ToList();

            var todosEventos = listaClases.Concat(listaEntrenamientos).OrderBy(x => x.Fecha).ToList();

            var totalEventos = todosEventos.Count;
            var totalInscritos = todosEventos.Sum(x => x.Inscriptos);
            var totalPresentes = todosEventos.Sum(x => x.Presentes);
            double tasaGeneral = totalInscritos > 0 ? (double)totalPresentes / totalInscritos * 100 : 0;

            return Ok(new
            {
                desde,
                hasta = fechaHastaFinDia,
                totalEventos,
                totalInscritos,
                totalPresentes,
                tasaGeneral = Math.Round(tasaGeneral, 1),
                eventos = todosEventos
            });
        }

        [HttpGet("reservas")]
        public async Task<IActionResult> GetReservasReport([FromQuery] DateTime desde, [FromQuery] DateTime hasta)
        {
            var fechaHastaFinDia = hasta.Date.AddDays(1).AddTicks(-1);

            var reservas = await _context.Reservas
                .Include(r => r.Cancha)
                .Include(r => r.Persona)
                .Where(r => r.Fecha >= desde && r.Fecha <= fechaHastaFinDia)
                .OrderBy(r => r.Fecha)
                .ToListAsync();

            var totalReservas = reservas.Count;
            var confirmadas = reservas.Count(r => r.Estado == "Confirmada");
            var canceladas = reservas.Count(r => r.Estado == "Cancelada");
            var pendientes = reservas.Count(r => r.Estado == "Pendiente" || r.Estado == "PendienteVerificacion");
            var expiradas = reservas.Count(r => r.Estado == "Expirada");

            double tasaCancelacion = totalReservas > 0 ? (double)canceladas / totalReservas * 100 : 0;

            var porCancha = reservas.GroupBy(r => r.Cancha?.Superficie ?? $"Cancha #{r.CanchaId}")
                .Select(g => new
                {
                    Cancha = g.Key,
                    Total = g.Count(),
                    IngresoEstimado = g.Where(r => r.Estado == "Confirmada").Sum(r => r.Precio)
                })
                .ToList();

            return Ok(new
            {
                desde,
                hasta = fechaHastaFinDia,
                totalReservas,
                confirmadas,
                canceladas,
                pendientes,
                expiradas,
                tasaCancelacion = Math.Round(tasaCancelacion, 1),
                porCancha,
                reservas = reservas.Select(r => new
                {
                    r.Id,
                    Cancha = r.Cancha?.Superficie ?? $"Cancha #{r.CanchaId}",
                    Cliente = r.Persona == null ? $"Cliente #{r.PersonaId}" : $"{r.Persona.Nombre} {r.Persona.Apellido}".Trim(),
                    r.Fecha,
                    HoraInicio = r.HoraInicio.ToString(@"hh\:mm"),
                    HoraFin = r.HoraFin.ToString(@"hh\:mm"),
                    r.Precio,
                    r.Estado,
                    Pago = r.Pago ? "Pagado" : "Pendiente"
                })
            });
        }
    }
}
