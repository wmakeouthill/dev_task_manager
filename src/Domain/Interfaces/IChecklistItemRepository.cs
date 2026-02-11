using DevTaskManager.Domain.Entities;

namespace DevTaskManager.Domain.Interfaces;

public interface IChecklistItemRepository
{
    Task<ChecklistItem?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<ChecklistItem>> ListByCardAsync(Guid cardId, CancellationToken ct = default);
    Task<ChecklistItem> SaveAsync(ChecklistItem item, CancellationToken ct = default);
    Task UpdateAsync(ChecklistItem item, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
