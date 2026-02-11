using DevTaskManager.Application.DTOs;
using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Application.Services;

public class GetBoardService(IBoardRepository repository)
{
    public async Task<BoardDto> ExecuteAsync(Guid id, CancellationToken ct = default)
    {
        var board = await repository.GetByIdAsync(id, ct)
            ?? throw new EntidadeNaoEncontradaException("Board", id);
        return BoardDto.From(board);
    }
}
