using Domain.Entities;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Application.Commands;
using Application.DTOs;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;

namespace Application.Handlers;

public class GoogleLoginPersonaCommandHandler
{
    private readonly IPersonaRepository _repo;
    private readonly IUnitOfWork _uow;
    private readonly IConfiguration _configuration;
    private readonly ITokenService _tokenService;

    public GoogleLoginPersonaCommandHandler(
        IPersonaRepository repo,
        IUnitOfWork uow,
        IConfiguration configuration,
        ITokenService tokenService)
    {
        _repo = repo;
        _uow = uow;
        _configuration = configuration;
        _tokenService = tokenService;
    }

    public async Task<AuthResult?> HandleAsync(GoogleLoginCommand command)
    {
        try
        {
            var clientId = _configuration["Authentication:Google:ClientId"];

            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                IssuedAtClockTolerance = TimeSpan.FromMinutes(5),
                ExpirationTimeClockTolerance = TimeSpan.FromMinutes(5)
            };

            if (!string.IsNullOrEmpty(clientId))
                settings.Audience = new[] { clientId };

            var payload = await GoogleJsonWebSignature.ValidateAsync(command.IdToken, settings);
            if (payload == null) return null;

            var persona = await _repo.GetByEmailAsync(payload.Email);

            if (persona == null)
            {
                persona = new Usuario
                {
                    Email    = payload.Email,
                    Nombre   = payload.GivenName ?? payload.Name ?? "Usuario",
                    Apellido = payload.FamilyName ?? "",
                    Rol      = "Usuario",
                    PasswordHash = Guid.NewGuid().ToString("N") + "A1!"
                };

                await _repo.AddAsync(persona);
                await _uow.SaveChangesAsync();
            }

            var token = _tokenService.GenerateToken(persona);

            return new AuthResult(persona.Id, persona.Nombre, persona.Apellido,
                persona.Email, persona.Rol, persona.Legajo, persona.Dni, token);
        }
        catch (InvalidJwtException ex)
        {
            Console.WriteLine($"[Google Auth] JWT inválido: {ex.Message}");
            return null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Google Auth] Error: {ex.Message}");
            return null;
        }
    }
}
