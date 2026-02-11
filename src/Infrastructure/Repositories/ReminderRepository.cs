using DevTaskManager.Domain.Entities;
using DevTaskManager.Domain.Interfaces;
using DevTaskManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DevTaskManager.Infrastructure.Repositories;

public class ReminderRepository(AppDbContext context) : IReminderRepository
{
    public async Task<Reminder?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await context.Reminders.FirstOrDefaultAsync(r => r.Id == id, ct);

    public async Task<(IReadOnlyList<Reminder> Items, long Total)> ListAsync(int page, int size, CancellationToken ct = default)
    {
        var query = context.Reminders.OrderBy(r => r.ScheduleAt);
        var total = await query.LongCountAsync(ct);
        var items = await query.Skip((page - 1) * size).Take(size).ToListAsync(ct);
        return (items, total);
    }

    public async Task<IReadOnlyList<Reminder>> GetPendingAsync(DateTime now, CancellationToken ct = default)
        => await context.Reminders
            .Where(r => r.Status == ReminderStatus.Pending && r.ScheduleAt <= now)
            .Where(r => r.SnoozeUntil == null || r.SnoozeUntil <= DateTime.UtcNow)
            .OrderBy(r => r.ScheduleAt)
            .ToListAsync(ct);

    public async Task<Reminder> SaveAsync(Reminder reminder, CancellationToken ct = default)
    {
        context.Reminders.Add(reminder);
        await context.SaveChangesAsync(ct);
        return reminder;
    }

    public async Task UpdateAsync(Reminder reminder, CancellationToken ct = default)
    {
        context.Reminders.Update(reminder);
        await context.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var reminder = await GetByIdAsync(id, ct);
        if (reminder is not null)
        {
            context.Reminders.Remove(reminder);
            await context.SaveChangesAsync(ct);
        }
    }
}
