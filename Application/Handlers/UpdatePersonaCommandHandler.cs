using Application.Commands;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Domain.Entities;
using System;
using System.IO;
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
        persona.Direccion = command.Direccion ?? string.Empty;
        persona.Telefono = command.Telefono ?? string.Empty;

        // Process profile picture
        if (command.FotoPerfil == "REMOVE")
        {
            persona.FotoPerfil = null;
        }
        else if (!string.IsNullOrEmpty(command.FotoPerfil))
        {
            var cleanFoto = command.FotoPerfil;
            if (cleanFoto.StartsWith("http://localhost:5071"))
            {
                cleanFoto = cleanFoto.Substring("http://localhost:5071".Length);
            }

            if (cleanFoto.StartsWith("data:image/"))
            {
                try
                {
                    var parts = cleanFoto.Split(',');
                    if (parts.Length > 1)
                    {
                        var base64Data = parts[1];
                        var imageBytes = Convert.FromBase64String(base64Data);
                        
                        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                        if (!Directory.Exists(uploadsFolder))
                        {
                            Directory.CreateDirectory(uploadsFolder);
                        }

                        string extension = ".jpg";
                        if (parts[0].Contains("png")) extension = ".png";
                        else if (parts[0].Contains("gif")) extension = ".gif";

                        var fileName = $"avatar_{persona.Id}{extension}";
                        var filePath = Path.Combine(uploadsFolder, fileName);
                        await File.WriteAllBytesAsync(filePath, imageBytes);
                        
                        persona.FotoPerfil = $"/uploads/{fileName}";
                    }
                }
                catch
                {
                    // Skip saving if invalid base64
                }
            }
            else
            {
                persona.FotoPerfil = cleanFoto;
            }
        }

        // Process certificate PDF
        if (command.CertificadoPdf == "REMOVE")
        {
            persona.CertificadoPdf = null;
        }
        else if (!string.IsNullOrEmpty(command.CertificadoPdf))
        {
            var cleanPdf = command.CertificadoPdf;
            string? rolePrefix = null;

            if (cleanPdf.Contains(':'))
            {
                var parts = cleanPdf.Split(':', 2);
                if (parts[0] == "Entrenador" || parts[0] == "Profesor")
                {
                    rolePrefix = parts[0];
                    cleanPdf = parts[1];
                }
            }

            if (cleanPdf.StartsWith("http://localhost:5071"))
            {
                cleanPdf = cleanPdf.Substring("http://localhost:5071".Length);
            }

            if (cleanPdf.StartsWith("data:application/pdf;base64,"))
            {
                try
                {
                    var parts = cleanPdf.Split(',');
                    if (parts.Length > 1)
                    {
                        var base64Data = parts[1];
                        var fileBytes = Convert.FromBase64String(base64Data);
                        
                        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "certificates");
                        if (!Directory.Exists(uploadsFolder))
                        {
                            Directory.CreateDirectory(uploadsFolder);
                        }

                        var fileName = $"certificado_{persona.Id}.pdf";
                        var filePath = Path.Combine(uploadsFolder, fileName);
                        await File.WriteAllBytesAsync(filePath, fileBytes);
                        
                        cleanPdf = $"/uploads/certificates/{fileName}";
                    }
                }
                catch
                {
                    // Skip saving if invalid base64
                }
            }

            if (!string.IsNullOrEmpty(rolePrefix))
            {
                persona.CertificadoPdf = $"{rolePrefix}:{cleanPdf}";
            }
            else
            {
                persona.CertificadoPdf = cleanPdf;
            }
        }

        await _repo.UpdateAsync(persona);
        await _uow.SaveChangesAsync();
    }
}
