using Application.Commands;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using System.Threading.Tasks;

namespace Application.Handlers;

public class DeletePersonaCommandHandler
{
    private readonly IPersonaRepository _repo;
    private readonly IUnitOfWork _uow;

    public DeletePersonaCommandHandler(IPersonaRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task HandleAsync(DeletePersonaCommand command)
    {
        await _repo.DeleteAsync(command.Id);
        await _uow.SaveChangesAsync();
    }
}
