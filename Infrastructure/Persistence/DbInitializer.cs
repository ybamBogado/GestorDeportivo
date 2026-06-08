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
        EnsureDynamicTables(context);

        try
        {
            context.Database.ExecuteSqlRaw(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PERSONA') AND name = 'CertificadoPdf') " +
                "ALTER TABLE PERSONA ADD CertificadoPdf NVARCHAR(MAX) NULL;");
            context.Database.ExecuteSqlRaw(
                "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('RESERVA') AND name = 'FechaExpiracion') " +
                "ALTER TABLE RESERVA ADD FechaExpiracion DATETIME2 NOT NULL CONSTRAINT DF_RESERVA_FechaExpiracion DEFAULT DATEADD(MINUTE, 15, SYSUTCDATETIME());");
        }
        catch (System.Exception ex)
        {
            System.Console.WriteLine($"Error actualizando esquema: {ex.Message}");
        }

        if (!context.Personas.Any())
        {
            //usuarios
            var bocaPlayers = new[]
            {
                ("Juan Roman", "Riquelme"),
                ("Martin", "Palermo"),
                ("Carlos", "Tevez"),
                ("Diego", "Maradona"),
                ("Roberto", "Abbondanzieri"),
                ("usuario", "1"),
                ("usuario", "2"),
                ("usuario", "3"),
                ("usuario", "4"),
                ("usuario", "5")
            };

            var personas = new List<Persona>();

            foreach (var (nombre, apellido) in bocaPlayers)
            {
                personas.Add(new Usuario
                {
                    Nombre = nombre,
                    Apellido = apellido,
                    Email = $"{nombre.Replace(" ", "").ToLowerInvariant()}{apellido.ToLowerInvariant()}@gol.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("123", 12),
                    Rol = "Usuario"
                });
            }
//Admins
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
//Empleados
            personas.Add(new Empleado
            {
                Nombre = "Carlos",
                Apellido = "Empleado",
                Email = "empleado@gmail.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123", 12),
                Rol = "Empleado",
                Area = "Administracion",
                Turno = "Manana",
                Dni = 38456123,
                Legajo = 1003,
                Direccion = "San Telmo, CABA",
                Telefono = "1145678901"
            });
//profesores
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
//Entrenadores
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

        if (!context.Equipos.Any())
        {
            var equipos = new List<Equipo>
            {
                new Equipo { Nombre = "Boca Juniors", Categoria = "Primera", Estado = "Activo" },
                new Equipo { Nombre = "River Plate", Categoria = "Primera", Estado = "Activo" },
                new Equipo { Nombre = "Independiente", Categoria = "Primera", Estado = "Activo" },
                new Equipo { Nombre = "Racing Club", Categoria = "Primera", Estado = "Activo" },
                new Equipo { Nombre = "San Lorenzo", Categoria = "Primera", Estado = "Activo" },
                new Equipo { Nombre = "Velez Sarsfield", Categoria = "Primera", Estado = "Activo" },
                new Equipo { Nombre = "Huracan", Categoria = "Primera", Estado = "Activo" },
                new Equipo { Nombre = "Belgrano", Categoria = "Primera", Estado = "Activo" },
                new Equipo { Nombre = "Estudiantes", Categoria = "Primera", Estado = "Activo" },
                new Equipo { Nombre = "Lanus", Categoria = "Primera", Estado = "Activo" }
            };
            context.Equipos.AddRange(equipos);
            context.SaveChanges();
        }

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

        if (!context.Torneos.Any())
        {
            var torneo = new Torneo
            {
                Nombre = "Copa Argentina 2026",
                Reglamento = "Eliminacion directa. Gana quien logre mas puntos.",
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

        if (!context.Canchas.Any())
        {
            context.Canchas.AddRange(
                new Futbol5 { Superficie = "Sintetico", Capacidad = 10, Estado = "Disponible" },
                new Futbol7 { Superficie = "Cesped Natural", Capacidad = 14, Estado = "Disponible" },
                new Futbol11 { Superficie = "Cesped Natural", Capacidad = 22, Estado = "Mantenimiento" }
            );

            context.SaveChanges();
        }

        var ligaInicial = context.Ligas.FirstOrDefault();
        var torneoInicial = context.Torneos.FirstOrDefault();
        var equiposSeed = context.Equipos.OrderBy(e => e.Id).ToList();

        if (ligaInicial != null)
        {
            foreach (var equipo in equiposSeed.Take(4))
            {
                if (!context.InscripcionesLiga.Any(i => i.LigaId == ligaInicial.Id && i.EquipoId == equipo.Id))
                {
                    context.InscripcionesLiga.Add(new InscripcionLiga
                    {
                        LigaId = ligaInicial.Id,
                        EquipoId = equipo.Id,
                        Estado = "Confirmado"
                    });
                }
            }

            context.SaveChanges();
        }

        if (torneoInicial != null)
        {
            foreach (var equipo in equiposSeed.Skip(4).Take(4))
            {
                if (!context.InscripcionesTorneo.Any(i => i.TorneoId == torneoInicial.Id && i.EquipoId == equipo.Id))
                {
                    context.InscripcionesTorneo.Add(new InscripcionTorneo
                    {
                        TorneoId = torneoInicial.Id,
                        EquipoId = equipo.Id,
                        Estado = "Confirmado"
                    });
                }
            }

            context.SaveChanges();
        }

        var canchaDisponible = context.Canchas.OrderBy(c => c.Id).FirstOrDefault(c => c.Estado != "Mantenimiento");
        var profesor = context.Profesores.FirstOrDefault();
        var entrenador = context.Entrenadores.FirstOrDefault();

        if (canchaDisponible != null && profesor != null && !context.Clases.Any())
        {
            context.Clases.AddRange(
                new Clase
                {
                    CanchaId = canchaDisponible.Id,
                    ProfesorId = profesor.Id,
                    Tipo = "Escuelita Inicial",
                    FechaHora = System.DateTime.UtcNow.AddDays(2).Date.AddHours(18),
                    CapacidadMax = 16,
                    Estado = "Programada"
                },
                new Clase
                {
                    CanchaId = canchaDisponible.Id,
                    ProfesorId = profesor.Id,
                    Tipo = "Tecnica Individual",
                    FechaHora = System.DateTime.UtcNow.AddDays(3).Date.AddHours(19),
                    CapacidadMax = 12,
                    Estado = "Programada"
                }
            );

            context.SaveChanges();
        }

        if (canchaDisponible != null && entrenador != null && !context.Entrenamientos.Any())
        {
            context.Entrenamientos.AddRange(
                new Entrenamiento
                {
                    CanchaId = canchaDisponible.Id,
                    EntrenadorId = entrenador.Id,
                    Tipo = "Entrenamiento de Velocidad",
                    Cronograma = "Circuitos, piques cortos y definicion",
                    Fecha = System.DateTime.UtcNow.AddDays(4).Date.AddHours(20),
                    Estado = "Programado"
                },
                new Entrenamiento
                {
                    CanchaId = canchaDisponible.Id,
                    EntrenadorId = entrenador.Id,
                    Tipo = "Entrenamiento Tactico",
                    Cronograma = "Movimientos colectivos y presion alta",
                    Fecha = System.DateTime.UtcNow.AddDays(5).Date.AddHours(21),
                    Estado = "Programado"
                }
            );

            context.SaveChanges();
        }
    }

    private static void EnsureDynamicTables(AppDbContext context)
    {
        if (!context.Database.ProviderName?.Contains("Sqlite", StringComparison.OrdinalIgnoreCase) ?? true)
            return;

        context.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS INSCRIPCION_CLASE (
                Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                ClaseId INTEGER NOT NULL,
                UsuarioId INTEGER NOT NULL,
                CobroId INTEGER NULL,
                Estado TEXT NOT NULL,
                FechaInscripcion TEXT NOT NULL,
                FOREIGN KEY (ClaseId) REFERENCES CLASE (Id) ON DELETE CASCADE,
                FOREIGN KEY (UsuarioId) REFERENCES PERSONA (Id) ON DELETE RESTRICT,
                FOREIGN KEY (CobroId) REFERENCES COBRO (Id) ON DELETE SET NULL
            );
            CREATE UNIQUE INDEX IF NOT EXISTS IX_INSCRIPCION_CLASE_ClaseId_UsuarioId
            ON INSCRIPCION_CLASE (ClaseId, UsuarioId);
        ");

        context.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS INSCRIPCION_ENTRENAMIENTO (
                Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                EntrenamientoId INTEGER NOT NULL,
                UsuarioId INTEGER NOT NULL,
                CobroId INTEGER NULL,
                Estado TEXT NOT NULL,
                FechaInscripcion TEXT NOT NULL,
                FOREIGN KEY (EntrenamientoId) REFERENCES ENTRENAMIENTO (Id) ON DELETE CASCADE,
                FOREIGN KEY (UsuarioId) REFERENCES PERSONA (Id) ON DELETE RESTRICT,
                FOREIGN KEY (CobroId) REFERENCES COBRO (Id) ON DELETE SET NULL
            );
            CREATE UNIQUE INDEX IF NOT EXISTS IX_INSCRIPCION_ENTRENAMIENTO_EntrenamientoId_UsuarioId
            ON INSCRIPCION_ENTRENAMIENTO (EntrenamientoId, UsuarioId);
        ");

        context.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS INSCRIPCION_EQUIPO (
                Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                EquipoId INTEGER NOT NULL,
                UsuarioId INTEGER NOT NULL,
                CobroId INTEGER NULL,
                Estado TEXT NOT NULL,
                FechaInscripcion TEXT NOT NULL,
                FOREIGN KEY (EquipoId) REFERENCES EQUIPO (Id) ON DELETE CASCADE,
                FOREIGN KEY (UsuarioId) REFERENCES PERSONA (Id) ON DELETE RESTRICT,
                FOREIGN KEY (CobroId) REFERENCES COBRO (Id) ON DELETE SET NULL
            );
            CREATE UNIQUE INDEX IF NOT EXISTS IX_INSCRIPCION_EQUIPO_EquipoId_UsuarioId
            ON INSCRIPCION_EQUIPO (EquipoId, UsuarioId);
        ");
    }
}
