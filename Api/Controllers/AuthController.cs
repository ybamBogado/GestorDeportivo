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

        public AuthController(RegisterPersonaCommandHandler registerHandler,
                              LoginPersonaCommandHandler loginHandler)
        {
            _registerHandler = registerHandler;
            _loginHandler = loginHandler;
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
    }
}
