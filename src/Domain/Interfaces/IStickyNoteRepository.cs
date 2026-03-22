using DevTaskManager.Domain.Entities;

namespace DevTaskManager.Domain.Interfaces;

public interface IStickyNoteRepository
{
    Task<IReadOnlyList<StickyNote>> ListAsync(Guid? boardId = null, CancellationToken ct = default);
    Task<StickyNote?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<StickyNote> SaveAsync(StickyNote note, CancellationToken ct = default);
    Task UpdateAsync(StickyNote note, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
