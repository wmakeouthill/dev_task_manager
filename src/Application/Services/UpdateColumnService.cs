using DevTaskManager.Application.DTOs;
using DevTaskManager.Application.Exceptions;
using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;
using FluentValidation;

namespace DevTaskManager.Application.Services;

public class UpdateColumnService(
    IBoardRepository boardRepository,
    IValidator<UpdateColumnRequest> validator)
{
    public async Task<ColumnDto> ExecuteAsync(Guid columnId, UpdateColumnRequest request, CancellationToken ct = default)
    {
        var result = await validator.ValidateAsync(request, ct);
        if (!result.IsValid)
            throw new ValidacaoException(result.Errors);

        var board = await boardRepository.GetByColumnIdAsync(columnId, ct)
            ?? throw new EntidadeNaoEncontradaException("Coluna", columnId);

        var column = board.Columns.FirstOrDefault(c => c.Id == columnId)!;
        if (!string.IsNullOrWhiteSpace(request.Nome))
            column.AtualizarNome(request.Nome);
        if (request.WipLimit.HasValue)
            column.DefinirWipLimit(request.WipLimit);

        await boardRepository.UpdateAsync(board, ct);
        return ColumnDto.From(column);
    }
}
