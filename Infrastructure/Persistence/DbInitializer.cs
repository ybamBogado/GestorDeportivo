using Domain.Entities;
using Infrastructure.Persistence;
using System.Collections.Generic;
using System.Linq;

using Microsoft.EntityFrameworkCore;

namespace Ticketinador2000.Infrastructure.Persistence;

public static class DbInitializer
{
    public static void Initialize(AppDbContext context)
    {
        try
        {
            context.Database.ExecuteSqlRaw(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PERSONA') AND name = 'CertificadoPdf') " +
                "ALTER TABLE PERSONA ADD CertificadoPdf NVARCHAR(MAX) NULL;");
        }
        catch (System.Exception ex)
        {
            System.Console.WriteLine($"Error actualizando esquema: {ex.Message}");
        }

        if (!context.Personas.Any())
        {
            var bocaPlayers = new[]
            {
                ("Juan Román", "Riquelme"),
                ("Martín",    "Palermo"),
                ("Carlos",    "Tevez"),
                ("Diego",     "Maradona"),
                ("Roberto",   "Abbondanzieri")
            };

            var personas = new List<Persona>();

            foreach (var (nombre, apellido) in bocaPlayers)
            {
                personas.Add(new Usuario
                {
                    Nombre = nombre,
                    Apellido = apellido,
                    Email = $"{nombre.Replace(" ", "").Replace("ó", "o").Replace("á", "a").ToLowerInvariant()}{apellido.ToLowerInvariant()}@bocajuniors.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("daleboca123", 12),
                    Rol = "Usuario"
                });
            }

            personas.Add(new Administrador
            {
                Nombre = "Ybam",
                Apellido = "Sas",
                Email = "ybam@bocajuniors.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123", 12),
                Rol = "Administrador"
            });

            personas.Add(new Administrador
            {
                Nombre = "Wilson",
                Apellido = "Rios",
                Email = "wilson@wil.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123", 12),
                Rol = "Administrador"
            });

            personas.Add(new Empleado
            {
                Nombre = "Carlos",
                Apellido = "Empleado",
                Email = "empleado@wil.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123", 12),
                Rol = "Empleado",
                Area = "Administración",
                Turno = "Mañana"
            });

            personas.Add(new Profesor
            {
                Nombre = "Martin",
                Apellido = "Profesor",
                Email = "profesor@wil.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123", 12),
                Rol = "Profesor",
                Certificacion = true,
                FechaVencimientoCertificacion = System.DateTime.UtcNow.AddYears(1)
            });

            personas.Add(new Entrenador
            {
                Nombre = "Roman",
                Apellido = "Entrenador",
                Email = "entrenador@wil.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123", 12),
                Rol = "Entrenador",
                Certificado = true,
                FechaVencimientoCertificacion = System.DateTime.UtcNow.AddYears(1)
            });

            personas.Add(new Usuario
            {
                Nombre = "Diego",
                Apellido = "Usuario",
                Email = "usuario@wil.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123", 12),
                Rol = "Usuario"
            });

            context.Personas.AddRange(personas);
            context.SaveChanges();
        }

        if (context.Canchas.Any()) return;

        context.Canchas.AddRange(
            new Futbol5 { Superficie = "Sintético", Capacidad = 10, Estado = "Disponible" },
            new Futbol7 { Superficie = "Césped Natural", Capacidad = 14, Estado = "Disponible" },
            new Futbol11 { Superficie = "Césped Natural", Capacidad = 22, Estado = "Mantenimiento" }
        );

        context.SaveChanges();
    }
}
