using DevTaskManager.Application.DTOs;
using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Application.Services;

public class GetWorkspaceService(IWorkspaceRepository repository)
{
    public async Task<WorkspaceDto> ExecuteAsync(Guid id, CancellationToken ct = default)
    {
        var workspace = await repository.GetByIdAsync(id, ct)
            ?? throw new EntidadeNaoEncontradaException("Workspace", id);
        return WorkspaceDto.From(workspace);
    }
}
