using Application.DTOs;
using Application.Interfaces.Repositories;
using Application.Queries;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Application.Handlers
{
    public class GetReservasQueryHandler
    {
        private readonly IReservaRepository _reservaRepository;

        public GetReservasQueryHandler(IReservaRepository reservaRepository)
        {
            _reservaRepository = reservaRepository;
        }

        public async Task<IEnumerable<ReservaDto>> HandleAsync(GetReservasQuery query)
        {
            var reservas = await _reservaRepository.GetAllAsync(query.Fecha, query.Estado);

            return reservas.Select(r => new ReservaDto
            {
                Id = r.Id,
                CanchaId = r.CanchaId,
                Cancha = r.Cancha?.Superficie ?? $"Cancha #{r.CanchaId}",
                PersonaId = r.PersonaId,
                Cliente = r.Persona == null ? $"Cliente #{r.PersonaId}" : $"{r.Persona.Nombre} {r.Persona.Apellido}".Trim(),
                Fecha = r.Fecha,
                FechaExpiracion = r.FechaExpiracion,
                HoraInicio = r.HoraInicio.ToString(@"hh\:mm"),
                HoraFin = r.HoraFin.ToString(@"hh\:mm"),
                Precio = r.Precio,
                Estado = r.Estado,
                Pago = r.Pago
            });
        }
    }
}
