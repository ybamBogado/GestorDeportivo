using Application.Interfaces.Repositories;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Infrastructure.Repositories
{
    public class PersonaRepository : IPersonaRepository
    {
        private readonly AppDbContext _context;

        public PersonaRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Persona?> GetByEmailAsync(string email)
        {
            return await _context.Personas.FirstOrDefaultAsync(p => p.Email == email);
        }

        public async Task AddAsync(Persona persona)
        {
            await _context.Personas.AddAsync(persona);
        }

        public async Task<IEnumerable<Persona>> GetAllAsync()
        {
            return await _context.Personas.ToListAsync();
        }

        public async Task<Persona?> GetByIdAsync(int id)
        {
            return await _context.Personas.FindAsync(id);
        }

        public async Task UpdateAsync(Persona persona)
        {
            _context.Personas.Update(persona);
            string discriminator = persona.Rol switch
            {
                "Administrador" => "Administrador",
                "Profesor" => "Profesor",
                "Entrenador" => "Entrenador",
                "Empleado" => "Empleado",
                _ => "Usuario"
            };
            if (discriminator == "Profesor")
            {
                await _context.Database.ExecuteSqlRawAsync(
                    "UPDATE PERSONA SET Discriminator = {0}, Certificacion = COALESCE(Certificacion, 1), FechaVencimientoCertificacion = COALESCE(FechaVencimientoCertificacion, {1}) WHERE Id = {2}",
                    discriminator,
                    System.DateTime.UtcNow.AddYears(1),
                    persona.Id
                );
            }
            else if (discriminator == "Entrenador")
            {
                await _context.Database.ExecuteSqlRawAsync(
                    "UPDATE PERSONA SET Discriminator = {0}, Certificado = COALESCE(Certificado, 1), FechaVencimientoCertificacion = COALESCE(FechaVencimientoCertificacion, {1}) WHERE Id = {2}",
                    discriminator,
                    System.DateTime.UtcNow.AddYears(1),
                    persona.Id
                );
            }
            else
            {
                await _context.Database.ExecuteSqlRawAsync(
                    "UPDATE PERSONA SET Discriminator = {0} WHERE Id = {1}", 
                    discriminator, 
                    persona.Id
                );
            }
        }

        public async Task DeleteAsync(int id)
        {
            var persona = await _context.Personas.FindAsync(id);
            if (persona != null)
            {
                _context.Personas.Remove(persona);
            }
        }
    }
}
