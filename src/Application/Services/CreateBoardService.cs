using DevTaskManager.Application.DTOs;
using DevTaskManager.Application.Exceptions;
using DevTaskManager.Domain.Entities;
using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;
using FluentValidation;

namespace DevTaskManager.Application.Services;

public class CreateBoardService(
    IBoardRepository boardRepository,
    IWorkspaceRepository workspaceRepository,
    IValidator<CreateBoardRequest> validator)
{
    public async Task<BoardDto> ExecuteAsync(Guid workspaceId, CreateBoardRequest request, CancellationToken ct = default)
    {
        var result = await validator.ValidateAsync(request, ct);
        if (!result.IsValid)
            throw new ValidacaoException(result.Errors);

        _ = await workspaceRepository.GetByIdAsync(workspaceId, ct)
            ?? throw new EntidadeNaoEncontradaException("Workspace", workspaceId);

        var board = Board.Criar(workspaceId, request.Nome);
        var saved = await boardRepository.SaveAsync(board, ct);
        return BoardDto.From(saved);
    }
}
