using DevTaskManager.Domain.Entities;

namespace DevTaskManager.Domain.Interfaces;

public interface IReminderRepository
{
    Task<Reminder?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<(IReadOnlyList<Reminder> Items, long Total)> ListAsync(int page, int size, CancellationToken ct = default);
    Task<IReadOnlyList<Reminder>> GetPendingAsync(DateTime now, CancellationToken ct = default);
    Task<Reminder> SaveAsync(Reminder reminder, CancellationToken ct = default);
    Task UpdateAsync(Reminder reminder, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
