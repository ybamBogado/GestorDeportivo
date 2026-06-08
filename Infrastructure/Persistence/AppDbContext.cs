using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
        
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<Complejo> Complejos { get; set; }
        
        // Jerarquía de Canchas
        public DbSet<Cancha> Canchas { get; set; }
        public DbSet<Futbol5> Futbol5s { get; set; }
        public DbSet<Futbol7> Futbol7s { get; set; }
        public DbSet<Futbol11> Futbol11s { get; set; }
        public DbSet<CanchaBloqueo> CanchaBloqueos { get; set; }

        // Nuevas entidades basadas en el UML
        public DbSet<Reserva> Reservas { get; set; }
        public DbSet<Cobro> Cobros { get; set; }
        public DbSet<Recibo> Recibos { get; set; }
        public DbSet<Descuento> Descuentos { get; set; }
        public DbSet<Reporte> Reportes { get; set; }
        public DbSet<Entrenamiento> Entrenamientos { get; set; }
        public DbSet<Equipo> Equipos { get; set; }
        public DbSet<Liga> Ligas { get; set; }
        public DbSet<Torneo> Torneos { get; set; }
        public DbSet<InscripcionLiga> InscripcionesLiga { get; set; }
        public DbSet<InscripcionTorneo> InscripcionesTorneo { get; set; }
        public DbSet<Partido> Partidos { get; set; }
        public DbSet<Fixture> Fixtures { get; set; }
        public DbSet<Clase> Clases { get; set; }
        public DbSet<Asistencia> Asistencias { get; set; }
        public DbSet<InscripcionClase> InscripcionesClase { get; set; }
        public DbSet<InscripcionEntrenamiento> InscripcionesEntrenamiento { get; set; }
        public DbSet<InscripcionEquipo> InscripcionesEquipo { get; set; }
        
        // Jerarquía de Personas
        public DbSet<Persona> Personas { get; set; }
        public DbSet<Administrador> Administradores { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Profesor> Profesores { get; set; }
        public DbSet<Entrenador> Entrenadores { get; set; }
        public DbSet<Empleado> Empleados { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Complejo>(entity =>
            {
                entity.ToTable("COMPLEJO");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Nombre).HasMaxLength(120);
                entity.Property(e => e.Direccion).HasMaxLength(180);
                entity.Property(e => e.Telefono).HasMaxLength(40);
            });

            modelBuilder.Entity<Cancha>(entity =>
            {
                entity.ToTable("CANCHA");
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.Complejo)
                    .WithMany(c => c.Canchas)
                    .HasForeignKey(e => e.ComplejoId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<Persona>(entity =>
            {
                entity.ToTable("PERSONA");
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.Complejo)
                    .WithMany(c => c.Miembros)
                    .HasForeignKey(e => e.ComplejoId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<Reserva>(entity =>
            {
                entity.ToTable("RESERVA");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Precio).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Estado).HasMaxLength(30);

                entity.HasOne(e => e.Complejo)
                    .WithMany(c => c.Reservas)
                    .HasForeignKey(e => e.ComplejoId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.Cancha)
                    .WithMany(c => c.Reservas)
                    .HasForeignKey(e => e.CanchaId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Persona)
                    .WithMany() // O WithMany(p => p.Reservas) si volvemos a poner la lista en Persona
                    .HasForeignKey(e => e.PersonaId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<CanchaBloqueo>(entity =>
            {
                entity.ToTable("CANCHA_BLOQUEO");
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Cancha)
                    .WithMany(c => c.Bloqueos)
                    .HasForeignKey(e => e.CanchaId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Cobro>(entity =>
            {
                entity.ToTable("COBRO");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Monto).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Descuento).HasColumnType("decimal(18,2)");
                entity.Property(e => e.MontoFinal).HasColumnType("decimal(18,2)");
                entity.HasOne(e => e.Reserva)
                    .WithOne(r => r.Cobro)
                    .HasForeignKey<Cobro>(e => e.ReservaId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<Recibo>(entity =>
            {
                entity.ToTable("RECIBO");
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Cobro)
                    .WithMany(c => c.Recibos)
                    .HasForeignKey(e => e.CobroId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Descuento>(entity =>
            {
                entity.ToTable("DESCUENTO");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Porcentaje).HasColumnType("decimal(5,2)");
            });

            modelBuilder.Entity<Equipo>(entity =>
            {
                entity.ToTable("EQUIPO");
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Capitan)
                    .WithMany()
                    .HasForeignKey(e => e.CapitanId)
                    .OnDelete(DeleteBehavior.SetNull);
                entity.HasMany(e => e.Jugadores)
                    .WithMany(u => u.Equipos)
                    .UsingEntity(j => j.ToTable("EQUIPO_JUGADOR"));
            });

            modelBuilder.Entity<Liga>(entity =>
            {
                entity.ToTable("LIGA");
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Complejo)
                    .WithMany(c => c.Ligas)
                    .HasForeignKey(e => e.ComplejoId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<Torneo>(entity =>
            {
                entity.ToTable("TORNEO");
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Complejo)
                    .WithMany(c => c.Torneos)
                    .HasForeignKey(e => e.ComplejoId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<InscripcionLiga>(entity =>
            {
                entity.ToTable("INSCRIPCION_LIGA");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.LigaId, e.EquipoId }).IsUnique();
                entity.HasOne(e => e.Liga)
                    .WithMany(l => l.Inscripciones)
                    .HasForeignKey(e => e.LigaId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Equipo)
                    .WithMany(eq => eq.InscripcionesLiga)
                    .HasForeignKey(e => e.EquipoId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Cobro)
                    .WithMany()
                    .HasForeignKey(e => e.CobroId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<InscripcionTorneo>(entity =>
            {
                entity.ToTable("INSCRIPCION_TORNEO");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.TorneoId, e.EquipoId }).IsUnique();
                entity.HasOne(e => e.Torneo)
                    .WithMany(t => t.Inscripciones)
                    .HasForeignKey(e => e.TorneoId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Equipo)
                    .WithMany(eq => eq.InscripcionesTorneo)
                    .HasForeignKey(e => e.EquipoId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Cobro)
                    .WithMany()
                    .HasForeignKey(e => e.CobroId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<Fixture>(entity =>
            {
                entity.ToTable("FIXTURE");
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Liga)
                    .WithMany(l => l.Fixtures)
                    .HasForeignKey(e => e.LigaId)
                    .OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(e => e.Torneo)
                    .WithMany(t => t.Fixtures)
                    .HasForeignKey(e => e.TorneoId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            modelBuilder.Entity<Partido>(entity =>
            {
                entity.ToTable("PARTIDO");
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Liga)
                    .WithMany(l => l.Partidos)
                    .HasForeignKey(e => e.LigaId)
                    .OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(e => e.Torneo)
                    .WithMany(t => t.Partidos)
                    .HasForeignKey(e => e.TorneoId)
                    .OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(e => e.EquipoLocal)
                    .WithMany()
                    .HasForeignKey(e => e.EquipoLocalId)
                    .OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(e => e.EquipoVisitante)
                    .WithMany()
                    .HasForeignKey(e => e.EquipoVisitanteId)
                    .OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(e => e.Cancha)
                    .WithMany()
                    .HasForeignKey(e => e.CanchaId)
                    .OnDelete(DeleteBehavior.SetNull);
                entity.HasOne(e => e.Fixture)
                    .WithMany(f => f.Partidos)
                    .HasForeignKey(e => e.FixtureId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<Clase>(entity =>
            {
                entity.ToTable("CLASE");
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Complejo)
                    .WithMany(c => c.Clases)
                    .HasForeignKey(e => e.ComplejoId)
                    .OnDelete(DeleteBehavior.SetNull);
                entity.HasOne(e => e.Cancha)
                    .WithMany()
                    .HasForeignKey(e => e.CanchaId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.Profesor)
                    .WithMany()
                    .HasForeignKey(e => e.ProfesorId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Asistencia>(entity =>
            {
                entity.ToTable("ASISTENCIA");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.ClaseId, e.UsuarioId }).IsUnique();
                entity.HasOne(e => e.Clase)
                    .WithMany(c => c.Asistencias)
                    .HasForeignKey(e => e.ClaseId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Usuario)
                    .WithMany(u => u.Asistencias)
                    .HasForeignKey(e => e.UsuarioId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<InscripcionClase>(entity =>
            {
                entity.ToTable("INSCRIPCION_CLASE");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.ClaseId, e.UsuarioId }).IsUnique();
                entity.HasOne(e => e.Clase)
                    .WithMany(c => c.Inscripciones)
                    .HasForeignKey(e => e.ClaseId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Usuario)
                    .WithMany(u => u.InscripcionesClase)
                    .HasForeignKey(e => e.UsuarioId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.Cobro)
                    .WithMany()
                    .HasForeignKey(e => e.CobroId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<InscripcionEntrenamiento>(entity =>
            {
                entity.ToTable("INSCRIPCION_ENTRENAMIENTO");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.EntrenamientoId, e.UsuarioId }).IsUnique();
                entity.HasOne(e => e.Entrenamiento)
                    .WithMany(ent => ent.Inscripciones)
                    .HasForeignKey(e => e.EntrenamientoId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Usuario)
                    .WithMany(u => u.InscripcionesEntrenamiento)
                    .HasForeignKey(e => e.UsuarioId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.Cobro)
                    .WithMany()
                    .HasForeignKey(e => e.CobroId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<InscripcionEquipo>(entity =>
            {
                entity.ToTable("INSCRIPCION_EQUIPO");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.EquipoId, e.UsuarioId }).IsUnique();
                entity.HasOne(e => e.Equipo)
                    .WithMany(eq => eq.InscripcionesEquipo)
                    .HasForeignKey(e => e.EquipoId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Usuario)
                    .WithMany(u => u.InscripcionesEquipo)
                    .HasForeignKey(e => e.UsuarioId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.Cobro)
                    .WithMany()
                    .HasForeignKey(e => e.CobroId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<Reporte>(entity =>
            {
                entity.ToTable("REPORTE");
                entity.HasKey(e => e.Id);

                entity.HasMany(e => e.Canchas)
                    .WithMany(c => c.Reportes)
                    .UsingEntity(j => j.ToTable("CANCHA_REPORTE"));
            });

            modelBuilder.Entity<Entrenamiento>(entity =>
            {
                entity.ToTable("ENTRENAMIENTO");
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.Cancha)
                    .WithMany(c => c.Entrenamientos)
                    .HasForeignKey(e => e.CanchaId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Profesor)
                    .WithMany()
                    .HasForeignKey(e => e.EntrenadorId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.Alumnos)
                    .WithMany(u => u.Entrenamientos)
                    .UsingEntity(j => j.ToTable("ENTRENAMIENTO_ALUMNO"));
            });

            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.ToTable("AUDIT_LOG");
                entity.HasKey(e => e.Id);
            });
        }
    }
}
