using Application.Commands;
using Application.Handlers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Api.Controllers;

[Route("api/v1/auth")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly RegisterPersonaCommandHandler _registerHandler;
    private readonly LoginPersonaCommandHandler    _loginHandler;
    private readonly GoogleLoginPersonaCommandHandler _googleHandler;

    public AuthController(
        RegisterPersonaCommandHandler registerHandler,
        LoginPersonaCommandHandler loginHandler,
        GoogleLoginPersonaCommandHandler googleHandler)
    {
        _registerHandler = registerHandler;
        _loginHandler    = loginHandler;
        _googleHandler   = googleHandler;
    }

    /// <summary>Registra un nuevo usuario.</summary>
    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Register([FromBody] RegisterPersonaCommand command)
    {
        try
        {
            var id = await _registerHandler.HandleAsync(command);
            return CreatedAtAction(nameof(Register), new { id }, "Cuenta creada con éxito");
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    /// <summary>Inicia sesión con email y contraseña.</summary>
    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Login([FromBody] LoginPersonaCommand command)
    {
        var result = await _loginHandler.HandleAsync(command);
        if (result == null) return Unauthorized("Credenciales inválidas");
        return Ok(result);
    }

    /// <summary>Inicia sesión con Google OAuth.</summary>
    [HttpPost("google")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginCommand command)
    {
        var result = await _googleHandler.HandleAsync(command);
        if (result == null) return Unauthorized("Token de Google inválido");
        return Ok(result);
    }
}
