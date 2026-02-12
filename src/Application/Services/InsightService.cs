using DevTaskManager.Application.DTOs;
using DevTaskManager.Domain.Entities;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Application.Services;

public class ListInsightsService(IInsightRepository insightRepo)
{
    public async Task<IReadOnlyList<InsightDto>> ExecuteAsync(CancellationToken ct = default)
    {
        var insights = await insightRepo.ListAsync(ct);
        return insights.Select(i => new InsightDto(
            i.Id, i.CardId, i.CardTitle, i.Status,
            i.Content, i.Provider, i.Action, i.DurationMs, i.CreatedAt
        )).ToList();
    }
}

public class SaveInsightsService(IInsightRepository insightRepo)
{
    public async Task<IReadOnlyList<InsightDto>> ExecuteAsync(SaveInsightsRequest request, CancellationToken ct = default)
    {
        var entities = request.Insights.Select(i =>
            Insight.Criar(i.CardId, i.CardTitle, i.Status, i.Content, i.Provider, request.Action, i.DurationMs)
        ).ToList();

        await insightRepo.SaveManyAsync(entities, ct);

        return entities.Select(i => new InsightDto(
            i.Id, i.CardId, i.CardTitle, i.Status,
            i.Content, i.Provider, i.Action, i.DurationMs, i.CreatedAt
        )).ToList();
    }
}

public class DeleteInsightService(IInsightRepository insightRepo)
{
    public async Task ExecuteAsync(Guid id, CancellationToken ct = default)
    {
        await insightRepo.DeleteAsync(id, ct);
    }
}

public class DeleteAllInsightsService(IInsightRepository insightRepo)
{
    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        await insightRepo.DeleteAllAsync(ct);
    }
}
