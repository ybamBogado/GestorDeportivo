using Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.Repositories;

public interface IPersonaRepository
{
    Task AddAsync(Persona persona);
    Task<Persona?> GetByEmailAsync(string email);
    Task<IEnumerable<Persona>> GetAllAsync();
    Task<Persona?> GetByIdAsync(int id);
    Task UpdateAsync(Persona persona);
    Task DeleteAsync(int id);
}
