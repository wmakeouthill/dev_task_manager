using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Application.Services;

public class DeleteColumnService(IBoardRepository boardRepository)
{
    public async Task ExecuteAsync(Guid columnId, CancellationToken ct = default)
    {
        var board = await boardRepository.GetByColumnIdAsync(columnId, ct)
            ?? throw new EntidadeNaoEncontradaException("Coluna", columnId);
        board.RemoverColuna(columnId);
        await boardRepository.UpdateAsync(board, ct);
    }
}
