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

            context.Database.ExecuteSqlRaw(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('RESERVA') AND name = 'ComprobantePdf') " +
                "ALTER TABLE RESERVA ADD ComprobantePdf NVARCHAR(MAX) NULL;");
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
                Email = "administrador@gmail.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123", 12),
                Rol = "Administrador",
                Dni = 94318839,
                Legajo = 1001,
                Direccion = "Puerto Madero, CABA",
                Telefono = "1123456789"
            });

            personas.Add(new Administrador
            {
                Nombre = "Wilson",
                Apellido = "Rios",
                Email = "admin2@gmail.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123", 12),
                Rol = "Administrador",
                Dni = 40567890,
                Legajo = 1002,
                Direccion = "Recoleta, CABA",
                Telefono = "1134567890"
            });

            personas.Add(new Empleado
            {
                Nombre = "Carlos",
                Apellido = "Empleado",
                Email = "empleado@gmail.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123", 12),
                Rol = "Empleado",
                Area = "Administración",
                Turno = "Mañana",
                Dni = 38456123,
                Legajo = 1003,
                Direccion = "San Telmo, CABA",
                Telefono = "1145678901"
            });

            personas.Add(new Profesor
            {
                Nombre = "Martin",
                Apellido = "Profesor",
                Email = "profesor@gmail.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123", 12),
                Rol = "Profesor",
                Certificacion = true,
                FechaVencimientoCertificacion = System.DateTime.UtcNow.AddYears(1),
                Dni = 35123456,
                Legajo = 1004,
                Direccion = "Palermo, CABA",
                Telefono = "1156789012"
            });

            personas.Add(new Entrenador
            {
                Nombre = "Roman",
                Apellido = "Entrenador",
                Email = "entrenador@gmail.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123", 12),
                Rol = "Entrenador",
                Certificado = true,
                FechaVencimientoCertificacion = System.DateTime.UtcNow.AddYears(1),
                Dni = 32987654,
                Legajo = 1005,
                Direccion = "La Boca, CABA",
                Telefono = "1167890123"
            });

            personas.Add(new Usuario
            {
                Nombre = "Diego",
                Apellido = "Usuario",
                Email = "usuario@gmail.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123", 12),
                Rol = "Usuario",
                Dni = 30123456,
                Legajo = 1006,
                Direccion = "Belgrano, CABA",
                Telefono = "1178901234"
            });

            context.Personas.AddRange(personas);
            context.SaveChanges();
        }

        // Seed de equipos
        if (!context.Equipos.Any())
        {
            var equipos = new List<Equipo>
            {
                new Equipo { Nombre = "Boca Juniors", Categoria = "Primera", Estado = "Activo" },
                new Equipo { Nombre = "River Plate", Categoria = "Primera", Estado = "Activo" },
                new Equipo { Nombre = "Independiente", Categoria = "Primera", Estado = "Activo" },
                new Equipo { Nombre = "Racing Club", Categoria = "Primera", Estado = "Activo" },
                new Equipo { Nombre = "San Lorenzo", Categoria = "Primera", Estado = "Activo" },
                new Equipo { Nombre = "Vélez Sársfield", Categoria = "Primera", Estado = "Activo" },
                new Equipo { Nombre = "Huracán", Categoria = "Primera", Estado = "Activo" },
                new Equipo { Nombre = "Belgrano", Categoria = "Primera", Estado = "Activo" },
                new Equipo { Nombre = "Estudiantes", Categoria = "Primera", Estado = "Activo" },
                new Equipo { Nombre = "Lanús", Categoria = "Primera", Estado = "Activo" }
            };
            context.Equipos.AddRange(equipos);
            context.SaveChanges();
        }

        // Seed de liga
        if (!context.Ligas.Any())
        {
            var liga = new Liga
            {
                Nombre = "Torneo Clausura 2026",
                Reglamento = "Todos juegan contra todos. 3 puntos por victoria, 1 por empate.",
                Estado = "Abierta",
                CupoEquipos = 16,
                FechaInicio = System.DateTime.UtcNow,
                FechaFin = System.DateTime.UtcNow.AddMonths(4),
                Categoria = "Primera",
                CantidadFechas = 15,
                CostoInscripcion = 5000
            };
            context.Ligas.Add(liga);
            context.SaveChanges();
        }

        // Seed de torneo
        if (!context.Torneos.Any())
        {
            var torneo = new Torneo
            {
                Nombre = "Copa Argentina 2026",
                Reglamento = "Eliminación directa. Gana quien logre más puntos.",
                Estado = "Abierto",
                CupoEquipos = 8,
                FechaInicio = System.DateTime.UtcNow.AddMonths(1),
                FechaFin = System.DateTime.UtcNow.AddMonths(3),
                Categoria = "Primera",
                Modalidad = "Eliminacion",
                PremioUSD = 10000,
                CostoInscripcion = 2500,
                Formato = "EliminacionDirecta"
            };
            context.Torneos.Add(torneo);
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
