using Application.Interfaces.Repositories;
using Application.Queries;
using Domain.Entities;
using System.Threading.Tasks;

namespace Application.Handlers;

public class GetPersonaByIdQueryHandler
{
    private readonly IPersonaRepository _repo;

    public GetPersonaByIdQueryHandler(IPersonaRepository repo)
    {
        _repo = repo;
    }

    public async Task<Persona?> HandleAsync(GetPersonaByIdQuery query)
    {
        return await _repo.GetByIdAsync(query.Id);
    }
}
