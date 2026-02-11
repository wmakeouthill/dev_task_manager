using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Application.Services;

public class DeleteCardService(ICardRepository repository)
{
    public async Task ExecuteAsync(Guid id, CancellationToken ct = default)
    {
        var card = await repository.GetByIdAsync(id, ct)
            ?? throw new EntidadeNaoEncontradaException("Card", id);
        await repository.DeleteAsync(id, ct);
    }
}
