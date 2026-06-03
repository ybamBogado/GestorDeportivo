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
                Nombre = "Admin",
                Apellido = "Sistema",
                Email = "admin@golahora.com",
                PasswordHash = "admin123",
                Rol = "Administrador"
            });
            context.Personas.AddRange(personas);
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