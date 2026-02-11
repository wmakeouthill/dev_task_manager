using DevTaskManager.Application.DTOs;
using DevTaskManager.Application.Services;

namespace DevTaskManager.WebApi.Endpoints;

public static class AiEndpoints
{
    public static void MapAiEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/ai")
            .WithTags("AI");

        group.MapPost("/action", async (AiActionRequest request, AiActionService service, CancellationToken ct) =>
        {
            var response = await service.ExecuteAsync(request, ct);
            return Results.Ok(response);
        })
        .WithName("AiAction")
        .WithSummary("Executa ação de IA no card (summarize, subtasks, clarify, risk)")
        .Produces<AiActionResponse>();
    }
}
