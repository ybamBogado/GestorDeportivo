using Application.Commands;
using Application.Handlers;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Api.Controllers
{
    [Route("api/v1/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly RegisterPersonaCommandHandler _registerHandler;
        private readonly LoginPersonaCommandHandler _loginHandler;
        private readonly GoogleLoginPersonaCommandHandler _googleLoginHandler;

        public AuthController(RegisterPersonaCommandHandler registerHandler,
                              LoginPersonaCommandHandler loginHandler,
                              GoogleLoginPersonaCommandHandler googleLoginHandler)
        {
            _registerHandler = registerHandler;
            _loginHandler = loginHandler;
            _googleLoginHandler = googleLoginHandler;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterPersonaCommand command)
        {
            var id = await _registerHandler.HandleAsync(command);
            return CreatedAtAction(nameof(Register), new { id }, "Persona creada con éxito");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginPersonaCommand command)
        {
            var persona = await _loginHandler.HandleAsync(command);
            
            if (persona == null) 
                return Unauthorized("Credenciales inválidas");
                
            return Ok(persona);
        }

        [HttpPost("google")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginCommand command)
        {
            var persona = await _googleLoginHandler.HandleAsync(command);
            
            if (persona == null) 
                return Unauthorized("Token de Google inválido");
                
            return Ok(persona);
        }
    }
}
