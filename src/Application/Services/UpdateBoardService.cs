using DevTaskManager.Application.DTOs;
using DevTaskManager.Application.Exceptions;
using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;
using FluentValidation;

namespace DevTaskManager.Application.Services;

public class UpdateBoardService(
    IBoardRepository repository,
    IValidator<UpdateBoardRequest> validator)
{
    public async Task<BoardDto> ExecuteAsync(Guid id, UpdateBoardRequest request, CancellationToken ct = default)
    {
        var result = await validator.ValidateAsync(request, ct);
        if (!result.IsValid)
            throw new ValidacaoException(result.Errors);

        var board = await repository.GetByIdAsync(id, ct)
            ?? throw new EntidadeNaoEncontradaException("Board", id);

        board.AtualizarNome(request.Nome);
        await repository.UpdateAsync(board, ct);
        return BoardDto.From(board);
    }
}
