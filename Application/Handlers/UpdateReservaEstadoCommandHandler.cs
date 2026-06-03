using Application.Commands;
using Application.Interfaces.Repositories;
using System;
using System.Threading.Tasks;

namespace Application.Handlers
{
    public class UpdateReservaEstadoCommandHandler
    {
        private readonly IReservaRepository _reservaRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateReservaEstadoCommandHandler(IReservaRepository reservaRepository, IUnitOfWork unitOfWork)
        {
            _reservaRepository = reservaRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task HandleAsync(UpdateReservaEstadoCommand command)
        {
            var reserva = await _reservaRepository.GetByIdAsync(command.Id);
            if (reserva == null)
            {
                throw new Exception("Reserva no encontrada");
            }

            reserva.Estado = string.IsNullOrWhiteSpace(command.Estado) ? reserva.Estado : command.Estado;

            await _reservaRepository.UpdateAsync(reserva);
            await _unitOfWork.SaveChangesAsync();
        }
    }
}
