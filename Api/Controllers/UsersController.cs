using Application.Commands;
using Application.Handlers;
using Application.Queries;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Api.Controllers
{
    [Route("api/v1/users")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAll([FromServices] GetPersonasQueryHandler handler)
        {
            var result = await handler.HandleAsync(new GetPersonasQuery());
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id, [FromServices] GetPersonaByIdQueryHandler handler)
        {
            var result = await handler.HandleAsync(new GetPersonaByIdQuery(id));
            if (result == null) return NotFound("Usuario no encontrado");
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdatePersonaCommand command, [FromServices] UpdatePersonaCommandHandler handler)
        {
            if (id != command.Id)
            {
                return BadRequest("ID no coincide");
            }
            await handler.HandleAsync(command);
            return Ok("Usuario actualizado con éxito");
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id, [FromServices] DeletePersonaCommandHandler handler)
        {
            await handler.HandleAsync(new DeletePersonaCommand(id));
            return Ok("Usuario eliminado con éxito");
        }
    }
}
