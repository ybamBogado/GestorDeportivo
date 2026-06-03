using Application.Interfaces.Repositories;
using Application.Queries;
using Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Handlers;

public class GetPersonasQueryHandler
{
    private readonly IPersonaRepository _repo;

    public GetPersonasQueryHandler(IPersonaRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<Persona>> HandleAsync(GetPersonasQuery query)
    {
        return await _repo.GetAllAsync();
    }
}
