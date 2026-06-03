using Application.Commands;
using Application.Interfaces.Repositories;
using Domain.Entities;
using System.Threading.Tasks;

namespace Application.Handlers
{
    public class CreateCanchaCommandHandler
    {
        private readonly ICanchaRepository _canchaRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreateCanchaCommandHandler(ICanchaRepository canchaRepository, IUnitOfWork unitOfWork)
        {
            _canchaRepository = canchaRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<int> HandleAsync(CreateCanchaCommand command)
        {
            Cancha nuevaCancha = command.TipoCancha switch
            {
                "Futbol7" => new Futbol7 { Superficie = command.Superficie, Capacidad = command.Capacidad, Estado = command.Estado },
                "Futbol11" => new Futbol11 { Superficie = command.Superficie, Capacidad = command.Capacidad, Estado = command.Estado },
                _ => new Futbol5 { Superficie = command.Superficie, Capacidad = command.Capacidad, Estado = command.Estado }
            };

            await _canchaRepository.AddAsync(nuevaCancha);
            await _unitOfWork.SaveChangesAsync();
            return nuevaCancha.Id;
        }
    }
}
