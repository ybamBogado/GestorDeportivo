using Domain.Entities;
using Infrastructure.Persistence;
using System.Collections.Generic;
using System.Linq;

namespace Ticketinador2000.Infrastructure.Persistence;

public static class DbInitializer
{
    public static void Initialize(AppDbContext context)
    {
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
