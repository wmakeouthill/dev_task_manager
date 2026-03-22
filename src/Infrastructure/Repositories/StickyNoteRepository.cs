using DevTaskManager.Domain.Entities;
using DevTaskManager.Domain.Interfaces;
using DevTaskManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DevTaskManager.Infrastructure.Repositories;

public class StickyNoteRepository(AppDbContext context) : IStickyNoteRepository
{
    public async Task<IReadOnlyList<StickyNote>> ListAsync(Guid? boardId = null, CancellationToken ct = default)
    {
        var query = context.StickyNotes.AsQueryable();

        if (boardId.HasValue)
            query = query.Where(n => n.BoardId == boardId.Value);
        else
            query = query.Where(n => n.BoardId == null);

        return await query.OrderBy(n => n.ZIndex).ThenBy(n => n.CreatedAt).ToListAsync(ct);
    }

    public async Task<StickyNote?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await context.StickyNotes.FirstOrDefaultAsync(n => n.Id == id, ct);

    public async Task<StickyNote> SaveAsync(StickyNote note, CancellationToken ct = default)
    {
        context.StickyNotes.Add(note);
        await context.SaveChangesAsync(ct);
        return note;
    }

    public async Task UpdateAsync(StickyNote note, CancellationToken ct = default)
    {
        context.StickyNotes.Update(note);
        await context.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var note = await GetByIdAsync(id, ct);
        if (note is not null)
        {
            context.StickyNotes.Remove(note);
            await context.SaveChangesAsync(ct);
        }
    }
}
