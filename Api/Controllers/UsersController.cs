using Application.Commands;
using Application.Handlers;
using Application.Queries;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
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

        [HttpPost("{id}/upload-pdf")]
        public async Task<IActionResult> UploadPdf(int id, IFormFile file, [FromServices] AppDbContext context)
        {
            if (file == null || file.Length == 0) return BadRequest("Archivo no válido");
            if (!file.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Solo se permiten archivos PDF");
            }

            var persona = await context.Personas.FindAsync(id);
            if (persona == null) return NotFound("Usuario no encontrado");

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            persona.CertificadoPdf = $"/uploads/{fileName}";
            await context.SaveChangesAsync();

            return Ok(new { filePath = persona.CertificadoPdf });
        }
    }
}
