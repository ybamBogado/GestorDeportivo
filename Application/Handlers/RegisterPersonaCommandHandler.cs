using Domain.Entities;
using Application.Interfaces.Repositories;
using Application.Commands;

namespace Application.Handlers;

public class RegisterPersonaCommandHandler
{
    private readonly IPersonaRepository _repo;
    private readonly IUnitOfWork _uow;

    public RegisterPersonaCommandHandler(IPersonaRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task<int> HandleAsync(RegisterPersonaCommand command)
    {
        Persona persona;

        switch (command.Rol)
        {
            case "Administrador":
                persona = new Administrador();
                break;
            case "Profesor":
                persona = new Profesor();
                break;
            case "Entrenador":
                persona = new Entrenador();
                break;
            case "Empleado":
                persona = new Empleado();
                break;
            default:
                persona = new Usuario(); 
                break;
        }

        persona.Email = command.Email;
        persona.PasswordHash = command.Password; 
        persona.Rol = string.IsNullOrEmpty(command.Rol) ? "Usuario" : command.Rol;
        persona.Nombre = command.Nombre;
        persona.Apellido = command.Apellido;

        await _repo.AddAsync(persona);
        await _uow.SaveChangesAsync();
        
        return persona.Id;
    }
}
