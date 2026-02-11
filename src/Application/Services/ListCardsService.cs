using DevTaskManager.Application.DTOs;
using DevTaskManager.Domain.Entities;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Application.Services;

public class ListCardsService(ICardRepository repository)
{
    public async Task<PagedResponse<CardDto>> ExecuteAsync(Guid boardId, int page, int size, CardStatus? status, CancellationToken ct = default)
    {
        var (items, total) = await repository.ListByBoardAsync(boardId, page, size, status, tag: null, ct);
        var totalPages = size > 0 ? (int)Math.Ceiling(total / (double)size) : 0;
        return new PagedResponse<CardDto>(
            items.Select(CardDto.From).ToList(),
            page,
            size,
            total,
            totalPages,
            page >= totalPages || items.Count < size);
    }
}
