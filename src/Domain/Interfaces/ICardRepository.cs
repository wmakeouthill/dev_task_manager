using DevTaskManager.Domain.Entities;

namespace DevTaskManager.Domain.Interfaces;

public interface ICardRepository
{
    Task<Card?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<(IReadOnlyList<Card> Items, long Total)> ListByBoardAsync(Guid boardId, int page, int size, CardStatus? status = null, string? tag = null, CancellationToken ct = default);
    Task<Card> SaveAsync(Card card, CancellationToken ct = default);
    Task UpdateAsync(Card card, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
