using Application.Commands;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Domain.Entities;
using System;
using System.Threading.Tasks;

namespace Application.Handlers;

public class UpdatePersonaCommandHandler
{
    private readonly IPersonaRepository _repo;
    private readonly IUnitOfWork _uow;

    public UpdatePersonaCommandHandler(IPersonaRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task HandleAsync(UpdatePersonaCommand command)
    {
        var persona = await _repo.GetByIdAsync(command.Id);
        if (persona == null)
        {
            throw new Exception("Usuario no encontrado");
        }

        persona.Nombre = command.Nombre;
        persona.Apellido = command.Apellido;
        persona.Dni = command.Dni;
        persona.Email = command.Email;
        persona.Legajo = command.Legajo;
        persona.Rol = string.IsNullOrEmpty(command.Rol) ? "Usuario" : command.Rol;

        await _repo.UpdateAsync(persona);
        await _uow.SaveChangesAsync();
    }
}
