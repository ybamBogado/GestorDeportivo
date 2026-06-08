using Application.Commands;
using Application.Interfaces.Repositories;
using Domain.Entities;
using System;
using System.Globalization;
using System.Threading.Tasks;

namespace Application.Handlers
{
    public class CreateReservaCommandHandler
    {
        private readonly IReservaRepository _reservaRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreateReservaCommandHandler(IReservaRepository reservaRepository, IUnitOfWork unitOfWork)
        {
            _reservaRepository = reservaRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<int> HandleAsync(CreateReservaCommand command)
        {
            var horaInicio = TimeSpan.ParseExact(command.HoraInicio, @"hh\:mm", CultureInfo.InvariantCulture);
            var horaFin = string.IsNullOrWhiteSpace(command.HoraFin)
                ? horaInicio.Add(TimeSpan.FromHours(1))
                : TimeSpan.ParseExact(command.HoraFin, @"hh\:mm", CultureInfo.InvariantCulture);

            var reserva = new Reserva
            {
                CanchaId = command.CanchaId,
                PersonaId = command.PersonaId,
                Fecha = command.Fecha.Date,
                HoraInicio = horaInicio,
                HoraFin = horaFin,
                Precio = command.Precio <= 0 ? 4500 : command.Precio,
                Estado = "Pendiente",
                Pago = command.Pago,
                FechaExpiracion = DateTime.UtcNow.AddMinutes(15),
                LimiteReserva = 1,
                LimiteHorario = 1
            };

            await _reservaRepository.AddAsync(reserva);
            await _unitOfWork.SaveChangesAsync();

            return reserva.Id;
        }
    }
}
