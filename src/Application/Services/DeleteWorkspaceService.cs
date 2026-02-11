using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Application.Services;

public class DeleteWorkspaceService(IWorkspaceRepository repository)
{
    public async Task ExecuteAsync(Guid id, CancellationToken ct = default)
    {
        var workspace = await repository.GetByIdAsync(id, ct)
            ?? throw new EntidadeNaoEncontradaException("Workspace", id);
        await repository.DeleteAsync(id, ct);
    }
}
