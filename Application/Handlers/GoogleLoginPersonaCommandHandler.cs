using Domain.Entities;
using Application.Interfaces.Repositories;
using Application.Commands;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;

namespace Application.Handlers;

public class GoogleLoginPersonaCommandHandler
{
    private readonly IPersonaRepository _repo;
    private readonly IUnitOfWork _uow;
    private readonly IConfiguration _configuration;

    public GoogleLoginPersonaCommandHandler(IPersonaRepository repo, IUnitOfWork uow, IConfiguration configuration)
    {
        _repo = repo;
        _uow = uow;
        _configuration = configuration;
    }

    public async Task<Persona?> HandleAsync(GoogleLoginCommand command)
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
            {
                settings.Audience = new[] { clientId };
            }

            // Validar token de Google
            var payload = await GoogleJsonWebSignature.ValidateAsync(command.IdToken, settings);
            if (payload == null)
            {
                return null;
            }

            var email = payload.Email;
            
            // Buscar si ya existe la persona en el repositorio
            var persona = await _repo.GetByEmailAsync(email);
            if (persona != null)
            {
                return persona;
            }

            // Si no existe, crear una nueva Persona (Usuario por defecto)
            var nuevaPersona = new Usuario
            {
                Email = email,
                Nombre = payload.GivenName ?? payload.Name ?? "Usuario",
                Apellido = payload.FamilyName ?? "",
                Rol = "Usuario",
                PasswordHash = Guid.NewGuid().ToString("N") + "A1!" // Contraseña aleatoria segura por defecto
            };

            await _repo.AddAsync(nuevaPersona);
            await _uow.SaveChangesAsync();

            return nuevaPersona;
        }
        catch (InvalidJwtException ex)
        {
            Console.WriteLine($"[Google Auth Error] JWT Inválido: {ex.Message}");
            return null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Google Auth Error] Error general: {ex.Message}");
            return null;
        }
    }
}
