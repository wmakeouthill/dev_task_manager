using DevTaskManager.Application.DTOs;
using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Application.Services;

public class GetCardService(ICardRepository repository)
{
    public async Task<CardDto> ExecuteAsync(Guid id, CancellationToken ct = default)
    {
        var card = await repository.GetByIdAsync(id, ct)
            ?? throw new EntidadeNaoEncontradaException("Card", id);
        return CardDto.From(card);
    }
}
