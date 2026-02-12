using DevTaskManager.Application.DTOs;
using DevTaskManager.Application.Services;
using DevTaskManager.Infrastructure.Ai;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.WebApi.Endpoints;

public static class AiEndpoints
{
    public static void MapAiEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/ai")
            .WithTags("AI");

        group.MapPost("/action", async (AiActionRequest request, AiActionService service,
            AiProviderFactory providerFactory, IAiProvider defaultProvider,
            HttpContext http, CancellationToken ct) =>
        {
            var provider = ResolveProvider(http, providerFactory, defaultProvider);
            var response = await service.ExecuteAsync(request, provider, ct);
            return Results.Ok(response);
        })
        .WithName("AiAction")
        .WithSummary("Executa ação de IA no card ou global (summarize, subtasks, clarify, risk, insights)")
        .Produces<AiActionResponse>();

        group.MapPost("/chat", async (AiChatRequest request, AiChatService chatService,
            AiProviderFactory providerFactory, IAiProvider defaultProvider,
            HttpContext http, CancellationToken ct) =>
        {
            var provider = ResolveProvider(http, providerFactory, defaultProvider);
            var response = await chatService.ExecuteAsync(request, provider, ct);
            return Results.Ok(response);
        })
        .WithName("AiChat")
        .WithSummary("Chat IA contextual do card com sugestões de descrição e subtarefas")
        .Produces<AiChatResponse>();

        group.MapPost("/insights/per-card", async (PerCardInsightRequest request, AiActionService service,
            AiProviderFactory providerFactory, IAiProvider defaultProvider,
            HttpContext http, CancellationToken ct) =>
        {
            var provider = ResolveProvider(http, providerFactory, defaultProvider);
            var response = await service.ExecutePerCardAsync(request.Action, provider, ct);
            return Results.Ok(response);
        })
        .WithName("AiPerCardInsights")
        .WithSummary("Gera um insight individual por card com AI habilitada")
        .Produces<PerCardInsightsResponse>();
    }

    private static IAiProvider ResolveProvider(HttpContext http, AiProviderFactory factory, IAiProvider fallback)
    {
        var providerName = http.Request.Headers["X-AI-Provider"].ToString();
        var apiKey = http.Request.Headers["X-AI-ApiKey"].ToString();
        var model = http.Request.Headers["X-AI-Model"].ToString();
        var baseUrl = http.Request.Headers["X-AI-BaseUrl"].ToString();
        return factory.TryCreate(providerName, apiKey, model, baseUrl, fallback)!;
    }
}
