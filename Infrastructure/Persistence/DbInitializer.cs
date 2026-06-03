using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;

namespace Ticketinador2000.Infrastructure.Persistence;

public static class DbInitializer
{
    public static void Initialize(AppDbContext context)
    {
        try
        {
            context.Database.ExecuteSqlRaw("ALTER TABLE PERSONA ADD CertificadoPdf NVARCHAR(MAX) NULL");
        }
        catch { }

        if (!context.Personas.Any())
        {
            var bocaPlayers = new string[]
            {
                "Juan Román Riquelme",
                "Martín Palermo",
                "Carlos Tevez",
                "Diego Maradona",
                "Roberto Abbondanzieri"
            };

            var personas = new List<Persona>(); // Usamos la clase Usuario que hereda de Persona
            foreach (var name in bocaPlayers)
            {
                var emailPrefix = name.Replace(" ", "").Replace("ó", "o").Replace("á", "a").ToLowerInvariant();
                personas.Add(new Usuario
                {
                    Nombre = name.Split(' ')[0],
                    Apellido = name.Contains(' ') ? name.Split(' ')[1] : "",
                    Email = $"{emailPrefix}@bocajuniors.com",
                    PasswordHash = "daleboca123",
                    Rol = "Usuario"
                });

            }


            personas.Add(new Administrador
            {
                Nombre = "Ybam",
                Apellido = "sas",
                Email = "ybam@bocajuniors.com",
                PasswordHash = "123",
                Rol = "Administrador"
            });

            personas.Add(new Administrador
            {
                Nombre = "Wilson",
                Apellido = "Huarachi",
                Email = "elviswilsonh@gmail.com",
                PasswordHash = "admin123",
                Rol = "Administrador"
            });

            personas.Add(new Profesor
            {
                Nombre = "Carlos",
                Apellido = "Bianchi",
                Email = "bianchi@boca.com",
                Rol = "Profesor",
                PasswordHash = "123",
                Certificacion = true,
                FechaVencimientoCertificacion = System.DateTime.UtcNow.AddYears(1)
            });

            context.Personas.AddRange(personas);
            context.SaveChanges();
        }

        if (!context.Equipos.Any())
        {
            var equipos = new List<Equipo>
            {
                new Equipo { Nombre = "Boca Seniors", Categoria = "Libre", Estado = "Activo" },
                new Equipo { Nombre = "River Seniors", Categoria = "Libre", Estado = "Activo" },
                new Equipo { Nombre = "San Lorenzo", Categoria = "Libre", Estado = "Activo" },
                new Equipo { Nombre = "Racing Club", Categoria = "Libre", Estado = "Activo" }
            };
            context.Equipos.AddRange(equipos);
            context.SaveChanges();
        }

        if (context.Canchas.Any())
        {
            return;
        }

        var canchas = new List<Cancha>
        {
            new Futbol5 { Superficie = "Sintético", Capacidad = 10, Estado = "Disponible" },
            new Futbol7 { Superficie = "Césped Natural", Capacidad = 14, Estado = "Disponible" },
            new Futbol11 { Superficie = "Césped Natural", Capacidad = 22, Estado = "Mantenimiento" }
        };

        context.Canchas.AddRange(canchas);
        context.SaveChanges();
    }
}