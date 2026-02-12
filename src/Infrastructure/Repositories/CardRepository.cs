using DevTaskManager.Domain.Entities;
using DevTaskManager.Domain.Interfaces;
using DevTaskManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DevTaskManager.Infrastructure.Repositories;

public class CardRepository(AppDbContext context) : ICardRepository
{
    public async Task<Card?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await context.Cards.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<(IReadOnlyList<Card> Items, long Total)> ListByBoardAsync(Guid boardId, int page, int size, CardStatus? status = null, string? tag = null, CancellationToken ct = default)
    {
        var query = context.Cards
            .Where(c => c.BoardId == boardId);
        if (status.HasValue)
            query = query.Where(c => c.Status == status.Value);
        query = query.OrderBy(c => c.Ordem).ThenBy(c => c.CreatedAt);

        var total = await query.LongCountAsync(ct);
        var items = await query
            .Skip((page - 1) * size)
            .Take(size)
            .ToListAsync(ct);
        return (items, total);
    }

    public async Task<Card> SaveAsync(Card card, CancellationToken ct = default)
    {
        context.Cards.Add(card);
        await context.SaveChangesAsync(ct);
        return card;
    }

    public async Task<IReadOnlyList<Card>> SearchAsync(string query, int limit = 10, CancellationToken ct = default)
    {
        var q = context.Cards.AsQueryable();
        if (!string.IsNullOrWhiteSpace(query))
            q = q.Where(c => EF.Functions.Like(c.Titulo, $"%{query}%"));
        return await q.OrderByDescending(c => c.CreatedAt).Take(limit).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Card>> ListAiEnabledAsync(CancellationToken ct = default)
        => await context.Cards
            .Where(c => c.AiEnabled)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);

    public async Task UpdateAsync(Card card, CancellationToken ct = default)
    {
        context.Cards.Update(card);
        await context.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var card = await GetByIdAsync(id, ct);
        if (card is not null)
        {
            context.Cards.Remove(card);
            await context.SaveChangesAsync(ct);
        }
    }
}
