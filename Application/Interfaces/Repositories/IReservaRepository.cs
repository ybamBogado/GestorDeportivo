using Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.Repositories;

public interface IReservaRepository
{
    Task<IEnumerable<Reserva>> GetAllAsync(DateTime? fecha = null, string? estado = null);
    Task<Reserva?> GetByIdAsync(int id);
    Task AddAsync(Reserva reserva);
    Task UpdateAsync(Reserva reserva);
    Task<bool> IsAvailableAsync(int canchaId, DateTime fecha, TimeSpan horaInicio, TimeSpan horaFin, int? excludeReservaId = null);
}
