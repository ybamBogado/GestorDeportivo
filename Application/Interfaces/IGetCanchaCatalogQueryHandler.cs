using Application.DTOs;
using Application.Queries;

namespace Application.Interfaces
{
    public interface IGetCanchaCatalogQueryHandler
    {
        Task<IEnumerable<CanchaCatalogDto>> HandlerAsync(GetCanchaCatalogQuery query);
    }
}
