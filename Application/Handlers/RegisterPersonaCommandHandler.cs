using Domain.Entities;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Application.Commands;

namespace Application.Handlers;

public class RegisterPersonaCommandHandler
{
    private readonly IPersonaRepository _repo;
    private readonly IUnitOfWork _uow;
    private readonly IPasswordHasher _hasher;

    public RegisterPersonaCommandHandler(IPersonaRepository repo, IUnitOfWork uow, IPasswordHasher hasher)
    {
        _repo = repo;
        _uow = uow;
        _hasher = hasher;
    }

    public async Task<int> HandleAsync(RegisterPersonaCommand command)
    {
        var existing = await _repo.GetByEmailAsync(command.Email);
        if (existing != null)
            throw new InvalidOperationException("Ya existe una cuenta con ese email.");

        Persona persona = command.Rol switch
        {
            "Administrador" => new Administrador(),
            "Profesor" => new Profesor(),
            "Entrenador" => new Entrenador(),
            "Empleado" => new Empleado(),
            _ => new Usuario()
        };

        persona.Email = command.Email;
        persona.PasswordHash = _hasher.Hash(command.Password);
        persona.Rol = string.IsNullOrEmpty(command.Rol) ? "Usuario" : command.Rol;
        persona.Nombre = command.Nombre;
        persona.Apellido = command.Apellido;

        await _repo.AddAsync(persona);
        await _uow.SaveChangesAsync();

        return persona.Id;
    }
}
