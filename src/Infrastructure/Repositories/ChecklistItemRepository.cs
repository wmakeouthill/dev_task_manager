using DevTaskManager.Domain.Entities;
using DevTaskManager.Domain.Interfaces;
using DevTaskManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DevTaskManager.Infrastructure.Repositories;

public class ChecklistItemRepository(AppDbContext context) : IChecklistItemRepository
{
    public async Task<ChecklistItem?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await context.ChecklistItems.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<IReadOnlyList<ChecklistItem>> ListByCardAsync(Guid cardId, CancellationToken ct = default)
        => await context.ChecklistItems
            .Where(c => c.CardId == cardId)
            .OrderBy(c => c.Ordem)
            .ToListAsync(ct);

    public async Task<ChecklistItem> SaveAsync(ChecklistItem item, CancellationToken ct = default)
    {
        context.ChecklistItems.Add(item);
        await context.SaveChangesAsync(ct);
        return item;
    }

    public async Task UpdateAsync(ChecklistItem item, CancellationToken ct = default)
    {
        context.ChecklistItems.Update(item);
        await context.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var item = await GetByIdAsync(id, ct);
        if (item is not null)
        {
            context.ChecklistItems.Remove(item);
            await context.SaveChangesAsync(ct);
        }
    }
}
