using DevTaskManager.Application.DTOs;
using DevTaskManager.Application.Exceptions;
using DevTaskManager.Domain.Entities;
using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;
using FluentValidation;

namespace DevTaskManager.Application.Services;

public class AddColumnService(
    IBoardRepository boardRepository,
    IValidator<CreateColumnRequest> validator)
{
    public async Task<ColumnDto> ExecuteAsync(Guid boardId, CreateColumnRequest request, CancellationToken ct = default)
    {
        var result = await validator.ValidateAsync(request, ct);
        if (!result.IsValid)
            throw new ValidacaoException(result.Errors);

        var board = await boardRepository.GetByIdAsync(boardId, ct)
            ?? throw new EntidadeNaoEncontradaException("Board", boardId);

        var ordem = request.Ordem ?? board.Columns.Count;
        var column = board.AdicionarColuna(request.Nome, ordem);
        await boardRepository.UpdateAsync(board, ct);
        return ColumnDto.From(column);
    }
}
