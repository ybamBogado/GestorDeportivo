using Application.Interfaces.Repositories;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Infrastructure.Repositories
{
    public class ReservaRepository : IReservaRepository
    {
        private readonly AppDbContext _context;

        public ReservaRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Reserva>> GetAllAsync(DateTime? fecha = null, string? estado = null)
        {
            var query = _context.Reservas
                .Include(r => r.Cancha)
                .Include(r => r.Persona)
                .AsQueryable();

            if (fecha.HasValue)
            {
                var selectedDate = fecha.Value.Date;
                query = query.Where(r => r.Fecha == selectedDate);
            }

            if (!string.IsNullOrWhiteSpace(estado) && estado != "Todas")
            {
                query = query.Where(r => r.Estado == estado);
            }

            return await query
                .OrderBy(r => r.Fecha)
                .ThenBy(r => r.HoraInicio)
                .ToListAsync();
        }

        public async Task<Reserva?> GetByIdAsync(int id)
        {
            return await _context.Reservas
                .Include(r => r.Cancha)
                .Include(r => r.Persona)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task AddAsync(Reserva reserva)
        {
            await _context.Reservas.AddAsync(reserva);
        }

        public async Task UpdateAsync(Reserva reserva)
        {
            _context.Reservas.Update(reserva);
            await Task.CompletedTask;
        }

        /// <summary>
        /// Verifica que no haya reservas activas ni bloqueos que se superpongan con el horario solicitado.
        /// </summary>
        public async Task<bool> IsAvailableAsync(int canchaId, DateTime fecha, TimeSpan horaInicio, TimeSpan horaFin, int? excludeReservaId = null)
        {
            // Comprobar superposición con otras reservas activas
            var hasConflict = await _context.Reservas
                .Where(r => r.CanchaId == canchaId
                         && r.Fecha == fecha.Date
                         && r.Estado != "Cancelada"
                         && (excludeReservaId == null || r.Id != excludeReservaId)
                         && r.HoraInicio < horaFin
                         && r.HoraFin   > horaInicio)
                .AnyAsync();

            if (hasConflict) return false;

            // Comprobar bloqueos de mantenimiento
            var fechaHoraInicio = fecha.Date + horaInicio;
            var fechaHoraFin    = fecha.Date + horaFin;

            var hasBloqueo = await _context.CanchaBloqueos
                .Where(b => b.CanchaId == canchaId
                         && b.Estado   != "Cancelado"
                         && b.FechaHoraInicio < fechaHoraFin
                         && b.FechaHoraFin    > fechaHoraInicio)
                .AnyAsync();

            return !hasBloqueo;
        }
    }
}
