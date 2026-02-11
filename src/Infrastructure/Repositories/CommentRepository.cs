using DevTaskManager.Domain.Entities;
using DevTaskManager.Domain.Interfaces;
using DevTaskManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DevTaskManager.Infrastructure.Repositories;

public class CommentRepository(AppDbContext context) : ICommentRepository
{
    public async Task<Comment?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await context.Comments.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<(IReadOnlyList<Comment> Items, long Total)> ListByCardAsync(Guid cardId, int page, int size, CancellationToken ct = default)
    {
        var query = context.Comments
            .Where(c => c.CardId == cardId)
            .OrderByDescending(c => c.CreatedAt);

        var total = await query.LongCountAsync(ct);
        var items = await query.Skip((page - 1) * size).Take(size).ToListAsync(ct);
        return (items, total);
    }

    public async Task<Comment> SaveAsync(Comment comment, CancellationToken ct = default)
    {
        context.Comments.Add(comment);
        await context.SaveChangesAsync(ct);
        return comment;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var comment = await GetByIdAsync(id, ct);
        if (comment is not null)
        {
            context.Comments.Remove(comment);
            await context.SaveChangesAsync(ct);
        }
    }
}
