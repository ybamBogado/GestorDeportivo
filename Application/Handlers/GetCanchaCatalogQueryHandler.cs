using Application.DTOs;
using Application.Queries;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Application.Handlers
{
    public class GetCanchaCatalogQueryHandler: IGetCanchaCatalogQueryHandler
    {
        private readonly ICanchaRepository _canchaRepository;

        public GetCanchaCatalogQueryHandler(ICanchaRepository canchaRepository)
        {
            _canchaRepository = canchaRepository;
        }

        public async Task<IEnumerable<CanchaCatalogDto>> HandlerAsync(GetCanchaCatalogQuery query)
        {
            var canchas = await _canchaRepository.GetAllAsync();

            var catalog = canchas.Select(c => new CanchaCatalogDto
            {
                Id         = c.Id,
                Superficie = c.Superficie,
                Capacidad  = c.Capacidad,
                Estado     = c.Estado,
                TipoCancha = c.GetType().Name, // Futbol5, Futbol7, Futbol11
                DuracionMaximaMinutos = c.GetDuracionMaxima(),
                PrecioHora = c.PrecioHora
            });
            return catalog;
        }
    }
}
