using DevTaskManager.Domain.Entities;
using DevTaskManager.Domain.Interfaces;
using DevTaskManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DevTaskManager.Infrastructure.Repositories;

public class InsightRepository(AppDbContext context) : IInsightRepository
{
    public async Task<IReadOnlyList<Insight>> ListAsync(CancellationToken ct = default)
        => await context.Insights.OrderByDescending(i => i.CreatedAt).ToListAsync(ct);

    public async Task<Insight> SaveAsync(Insight insight, CancellationToken ct = default)
    {
        context.Insights.Add(insight);
        await context.SaveChangesAsync(ct);
        return insight;
    }

    public async Task SaveManyAsync(IReadOnlyList<Insight> insights, CancellationToken ct = default)
    {
        context.Insights.AddRange(insights);
        await context.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var insight = await context.Insights.FirstOrDefaultAsync(i => i.Id == id, ct);
        if (insight is not null)
        {
            context.Insights.Remove(insight);
            await context.SaveChangesAsync(ct);
        }
    }

    public async Task DeleteAllAsync(CancellationToken ct = default)
    {
        context.Insights.RemoveRange(context.Insights);
        await context.SaveChangesAsync(ct);
    }
}
