using Domain.Entities;

namespace Application.Interfaces.Repositories;

public interface IPersonaRepository
{
    Task AddAsync(Persona persona);
    Task<Persona?> GetByEmailAsync(string email);
}
