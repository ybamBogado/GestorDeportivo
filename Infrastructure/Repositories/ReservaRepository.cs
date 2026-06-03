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
    }
}
