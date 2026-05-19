using Application.Interfaces.Repositories;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Infrastructure.Repositories
{
    public class CanchaRepository : ICanchaRepository
    {
        private readonly AppDbContext _context;

        public CanchaRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Cancha>> GetAllAsync()
        {
            return await _context.Canchas.ToListAsync();
        }

        public async Task<Cancha?> GetByIdAsync(int id)
        {
            return await _context.Canchas.FindAsync(id);
        }

        public async Task AddAsync(Cancha cancha)
        {
            await _context.Canchas.AddAsync(cancha);
        }

        public async Task UpdateAsync(Cancha cancha)
        {
            _context.Canchas.Update(cancha);
            await Task.CompletedTask; // EF maneja el tracking
        }

        public async Task DeleteAsync(int id)
        {
            var cancha = await _context.Canchas.FindAsync(id);
            if (cancha != null)
            {
                _context.Canchas.Remove(cancha);
            }
        }
    }
}
