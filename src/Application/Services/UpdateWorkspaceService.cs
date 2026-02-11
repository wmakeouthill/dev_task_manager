using DevTaskManager.Application.DTOs;
using DevTaskManager.Application.Exceptions;
using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;
using FluentValidation;

namespace DevTaskManager.Application.Services;

public class UpdateWorkspaceService(
    IWorkspaceRepository repository,
    IValidator<UpdateWorkspaceRequest> validator)
{
    public async Task<WorkspaceDto> ExecuteAsync(Guid id, UpdateWorkspaceRequest request, CancellationToken ct = default)
    {
        var result = await validator.ValidateAsync(request, ct);
        if (!result.IsValid)
            throw new ValidacaoException(result.Errors);

        var workspace = await repository.GetByIdAsync(id, ct)
            ?? throw new EntidadeNaoEncontradaException("Workspace", id);

        workspace.AtualizarNome(request.Nome);
        await repository.UpdateAsync(workspace, ct);
        return WorkspaceDto.From(workspace);
    }
}
