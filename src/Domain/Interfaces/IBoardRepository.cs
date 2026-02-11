using DevTaskManager.Domain.Entities;

namespace DevTaskManager.Domain.Interfaces;

public interface IBoardRepository
{
    Task<Board?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Board?> GetByColumnIdAsync(Guid columnId, CancellationToken ct = default);
    Task<(IReadOnlyList<Board> Items, long Total)> ListByWorkspaceAsync(Guid workspaceId, int page, int size, CancellationToken ct = default);
    Task<Board> SaveAsync(Board board, CancellationToken ct = default);
    Task UpdateAsync(Board board, CancellationToken ct = default);
    Task AddColumnAsync(Column column, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
