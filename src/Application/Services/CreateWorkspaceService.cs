using DevTaskManager.Application.DTOs;
using DevTaskManager.Application.Exceptions;
using DevTaskManager.Domain.Entities;
using DevTaskManager.Domain.Interfaces;
using FluentValidation;

namespace DevTaskManager.Application.Services;

public class CreateWorkspaceService(
    IWorkspaceRepository repository,
    IValidator<CreateWorkspaceRequest> validator)
{
    public async Task<WorkspaceDto> ExecuteAsync(CreateWorkspaceRequest request, CancellationToken ct = default)
    {
        var result = await validator.ValidateAsync(request, ct);
        if (!result.IsValid)
            throw new ValidacaoException(result.Errors);

        var workspace = Workspace.Criar(request.Nome, request.OwnerId);
        var saved = await repository.SaveAsync(workspace, ct);
        return WorkspaceDto.From(saved);
    }
}
