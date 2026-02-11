using DevTaskManager.Application.DTOs;
using DevTaskManager.Application.Exceptions;
using DevTaskManager.Domain.Entities;
using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;
using FluentValidation;

namespace DevTaskManager.Application.Services;

public class UpdateCardStatusService(
    ICardRepository repository,
    IValidator<UpdateCardStatusRequest> validator)
{
    public async Task<CardDto> ExecuteAsync(Guid id, UpdateCardStatusRequest request, CancellationToken ct = default)
    {
        var result = await validator.ValidateAsync(request, ct);
        if (!result.IsValid)
            throw new ValidacaoException(result.Errors);

        var card = await repository.GetByIdAsync(id, ct)
            ?? throw new EntidadeNaoEncontradaException("Card", id);

        var status = Enum.Parse<CardStatus>(request.Status, ignoreCase: true);
        card.AtualizarStatus(status);
        await repository.UpdateAsync(card, ct);
        return CardDto.From(card);
    }
}
