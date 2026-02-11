using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Application.Services;

public class DeleteBoardService(IBoardRepository repository)
{
    public async Task ExecuteAsync(Guid id, CancellationToken ct = default)
    {
        var board = await repository.GetByIdAsync(id, ct)
            ?? throw new EntidadeNaoEncontradaException("Board", id);
        await repository.DeleteAsync(id, ct);
    }
}
