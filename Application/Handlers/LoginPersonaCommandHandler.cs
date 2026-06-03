using Domain.Entities;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Application.Commands;
using Application.DTOs;

namespace Application.Handlers;

public class LoginPersonaCommandHandler
{
    private readonly IPersonaRepository _repo;
    private readonly IPasswordHasher _hasher;
    private readonly ITokenService _tokenService;

    public LoginPersonaCommandHandler(IPersonaRepository repo, IPasswordHasher hasher, ITokenService tokenService)
    {
        _repo = repo;
        _hasher = hasher;
        _tokenService = tokenService;
    }

    public async Task<AuthResult?> HandleAsync(LoginPersonaCommand command)
    {
        var persona = await _repo.GetByEmailAsync(command.Email);
        if (persona == null) return null;

        bool valid = _hasher.Verify(command.Password, persona.PasswordHash);
        if (!valid) return null;

        var token = _tokenService.GenerateToken(persona);

        return new AuthResult(persona.Id, persona.Nombre, persona.Apellido,
            persona.Email, persona.Rol, persona.Legajo, persona.Dni, token);
    }
}
