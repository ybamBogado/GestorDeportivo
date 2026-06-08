using Application.DTOs;
using Application.Queries;
using Application.Interfaces.Repositories;
using System.Threading.Tasks;

namespace Application.Handlers
{
    public class GetCanchaByIdQueryHandler
    {
        private readonly ICanchaRepository _canchaRepository;

        public GetCanchaByIdQueryHandler(ICanchaRepository canchaRepository)
        {
            _canchaRepository = canchaRepository;
        }

        public async Task<CanchaCatalogDto?> HandleAsync(GetCanchaByIdQuery query)
        {
            var cancha = await _canchaRepository.GetByIdAsync(query.Id);
            if (cancha == null) return null;

            return new CanchaCatalogDto
            {
                Id         = cancha.Id,
                Superficie = cancha.Superficie,
                Capacidad  = cancha.Capacidad,
                Estado     = cancha.Estado,
                TipoCancha = cancha.GetType().Name,
                DuracionMaximaMinutos = cancha.GetDuracionMaxima(),
                PrecioHora = cancha.PrecioHora
            };
        }
    }
}
