using DevTaskManager.Application.DTOs;
using DevTaskManager.Application.Exceptions;
using DevTaskManager.Domain.Entities;
using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;
using FluentValidation;

namespace DevTaskManager.Application.Services;

public class CreateCardService(
    ICardRepository cardRepository,
    IBoardRepository boardRepository,
    IValidator<CreateCardRequest> validator)
{
    public async Task<CardDto> ExecuteAsync(Guid boardId, CreateCardRequest request, CancellationToken ct = default)
    {
        var result = await validator.ValidateAsync(request, ct);
        if (!result.IsValid)
            throw new ValidacaoException(result.Errors);

        var board = await boardRepository.GetByIdAsync(boardId, ct)
            ?? throw new EntidadeNaoEncontradaException("Board", boardId);
        if (board.Columns.All(c => c.Id != request.ColumnId))
            throw new RegraDeNegocioException("Coluna não pertence a este board.");

        var card = Card.Criar(boardId, request.ColumnId, request.Titulo, request.Descricao, request.Ordem);
        var saved = await cardRepository.SaveAsync(card, ct);
        return CardDto.From(saved);
    }
}
