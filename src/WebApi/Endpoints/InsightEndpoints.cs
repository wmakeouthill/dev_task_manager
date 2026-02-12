using DevTaskManager.Application.DTOs;
using DevTaskManager.Application.Services;

namespace DevTaskManager.WebApi.Endpoints;

public static class InsightEndpoints
{
    public static void MapInsightEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/insights")
            .WithTags("Insights");

        group.MapGet("/", async (ListInsightsService service, CancellationToken ct) =>
        {
            var insights = await service.ExecuteAsync(ct);
            return Results.Ok(insights);
        })
        .WithName("ListInsights")
        .WithSummary("Lista todos os insights persistidos")
        .Produces<IReadOnlyList<InsightDto>>();

        group.MapPost("/", async (SaveInsightsRequest request, SaveInsightsService service, CancellationToken ct) =>
        {
            var saved = await service.ExecuteAsync(request, ct);
            return Results.Created("/api/v1/insights", saved);
        })
        .WithName("SaveInsights")
        .WithSummary("Persiste insights gerados pela IA")
        .Produces<IReadOnlyList<InsightDto>>(StatusCodes.Status201Created);

        group.MapDelete("/{id:guid}", async (Guid id, DeleteInsightService service, CancellationToken ct) =>
        {
            await service.ExecuteAsync(id, ct);
            return Results.NoContent();
        })
        .WithName("DeleteInsight")
        .WithSummary("Remove um insight individual");

        group.MapDelete("/", async (DeleteAllInsightsService service, CancellationToken ct) =>
        {
            await service.ExecuteAsync(ct);
            return Results.NoContent();
        })
        .WithName("DeleteAllInsights")
        .WithSummary("Remove todos os insights");
    }
}
