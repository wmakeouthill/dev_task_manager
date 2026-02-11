using DevTaskManager.Application.DTOs;
using DevTaskManager.Application.Exceptions;
using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;
using FluentValidation;

namespace DevTaskManager.Application.Services;

public class MoveColumnService(
    IBoardRepository boardRepository,
    IValidator<MoveColumnRequest> validator)
{
    public async Task<ColumnDto> ExecuteAsync(Guid columnId, MoveColumnRequest request, CancellationToken ct = default)
    {
        var result = await validator.ValidateAsync(request, ct);
        if (!result.IsValid)
            throw new ValidacaoException(result.Errors);

        var board = await boardRepository.GetByColumnIdAsync(columnId, ct)
            ?? throw new EntidadeNaoEncontradaException("Coluna", columnId);

        board.ReordenarColuna(columnId, request.NovaOrdem);
        await boardRepository.UpdateAsync(board, ct);

        var column = board.Columns.First(c => c.Id == columnId);
        return ColumnDto.From(column);
    }
}
