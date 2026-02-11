using DevTaskManager.Application.DTOs;
using DevTaskManager.Application.Exceptions;
using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;
using FluentValidation;

namespace DevTaskManager.Application.Services;

public class MoveCardService(
    ICardRepository cardRepository,
    IBoardRepository boardRepository,
    IValidator<MoveCardRequest> validator)
{
    public async Task<CardDto> ExecuteAsync(Guid cardId, MoveCardRequest request, CancellationToken ct = default)
    {
        var result = await validator.ValidateAsync(request, ct);
        if (!result.IsValid)
            throw new ValidacaoException(result.Errors);

        var card = await cardRepository.GetByIdAsync(cardId, ct)
            ?? throw new EntidadeNaoEncontradaException("Card", cardId);

        var board = await boardRepository.GetByIdAsync(card.BoardId, ct)!;
        if (board!.Columns.All(c => c.Id != request.ColumnId))
            throw new RegraDeNegocioException("Coluna de destino não pertence ao board do card.");

        card.MoverPara(request.ColumnId, request.Ordem);
        await cardRepository.UpdateAsync(card, ct);
        return CardDto.From(card);
    }
}
