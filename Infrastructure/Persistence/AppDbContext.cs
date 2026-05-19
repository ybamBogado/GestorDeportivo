using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
        
        public DbSet<AuditLog> AuditLogs { get; set; }
        
        // Jerarquía de Canchas
        public DbSet<Cancha> Canchas { get; set; }
        public DbSet<Futbol5> Futbol5s { get; set; }
        public DbSet<Futbol7> Futbol7s { get; set; }
        public DbSet<Futbol11> Futbol11s { get; set; }

        // Nuevas entidades basadas en el UML
        public DbSet<Reserva> Reservas { get; set; }
        public DbSet<Reporte> Reportes { get; set; }
        public DbSet<Entrenamiento> Entrenamientos { get; set; }
        
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

            modelBuilder.Entity<Cancha>(entity =>
            {
                entity.ToTable("CANCHA");
                entity.HasKey(e => e.Id);
                
                // Las colecciones (Reservas, Reportes, Entrenamientos) ya están definidas en la clase
            });

            modelBuilder.Entity<Persona>(entity =>
            {
                entity.ToTable("PERSONA");
                entity.HasKey(e => e.Id);
            });

            modelBuilder.Entity<Reserva>(entity =>
            {
                entity.ToTable("RESERVA");
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.Cancha)
                    .WithMany(c => c.Reservas)
                    .HasForeignKey(e => e.CanchaId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Persona)
                    .WithMany() // O WithMany(p => p.Reservas) si volvemos a poner la lista en Persona
                    .HasForeignKey(e => e.PersonaId)
                    .OnDelete(DeleteBehavior.Restrict);
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
                    .WithMany()
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