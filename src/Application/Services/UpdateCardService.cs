using DevTaskManager.Application.DTOs;
using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Application.Services;

public class UpdateCardService(ICardRepository repository)
{
    public async Task<CardDto> ExecuteAsync(Guid id, UpdateCardRequest request, CancellationToken ct = default)
    {
        var card = await repository.GetByIdAsync(id, ct)
            ?? throw new EntidadeNaoEncontradaException("Card", id);

        if (!string.IsNullOrWhiteSpace(request.Titulo))
            card.AtualizarTitulo(request.Titulo);
        if (request.Descricao != null)
            card.AtualizarDescricao(request.Descricao);
        if (request.DueDate.HasValue)
            card.DefinirDueDate(request.DueDate);

        await repository.UpdateAsync(card, ct);
        return CardDto.From(card);
    }
}
