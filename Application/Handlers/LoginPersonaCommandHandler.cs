using Domain.Entities;
using Application.Interfaces.Repositories;
using Application.Commands;

namespace Application.Handlers;

public class LoginPersonaCommandHandler
{
    private readonly IPersonaRepository _repo;

    public LoginPersonaCommandHandler(IPersonaRepository repo)
    {
        _repo = repo;
    }

    public async Task<Persona?> HandleAsync(LoginPersonaCommand command)
    {
        // Buscamos a la persona por su email en el repositorio base
        var persona = await _repo.GetByEmailAsync(command.Email);
        
        if (persona == null) return null;

        // Verificamos la contraseña ( esto debería ser con Hash en el futuro)
        if (persona.PasswordHash == command.Password)
        {
            // Retorna la instancia real (puede ser Administrador, Profesor, etc.)
            return persona; 
        }

        return null;
    }
}
