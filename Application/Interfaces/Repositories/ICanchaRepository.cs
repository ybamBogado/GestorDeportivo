using Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.Repositories
{
    public interface ICanchaRepository
    {
        Task<IEnumerable<Cancha>> GetAllAsync();
        Task<Cancha?> GetByIdAsync(int id);
        Task AddAsync(Cancha cancha);
        Task UpdateAsync(Cancha cancha);
        Task DeleteAsync(int id);
    }
}
