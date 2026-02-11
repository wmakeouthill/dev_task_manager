using DevTaskManager.Domain.Entities;

namespace DevTaskManager.Domain.Interfaces;

public interface ICommentRepository
{
    Task<Comment?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<(IReadOnlyList<Comment> Items, long Total)> ListByCardAsync(Guid cardId, int page, int size, CancellationToken ct = default);
    Task<Comment> SaveAsync(Comment comment, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
