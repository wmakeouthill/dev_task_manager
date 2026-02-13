using DevTaskManager.Application.DTOs;
using DevTaskManager.Application.Services;
using DevTaskManager.Infrastructure.Ai;
using DevTaskManager.Domain.Interfaces;
using System.Text.Json;

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

        group.MapGet("/ollama/models", async (string? baseUrl, CancellationToken ct) =>
        {
            var endpoint = NormalizeBaseUrl(baseUrl);
            using var http = new HttpClient { BaseAddress = new Uri(endpoint), Timeout = TimeSpan.FromSeconds(5) };

            try
            {
                var installed = await FetchInstalledModelsAsync(http, ct);
                var running = await FetchRunningModelsAsync(http, ct);

                var merged = installed
                    .Concat(running)
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToArray();

                return Results.Ok(new
                {
                    baseUrl = endpoint,
                    models = merged,
                    runningModels = running,
                    installedModels = installed
                });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new
                {
                    message = $"Não foi possível consultar o Ollama em {endpoint}. {ex.Message}"
                });
            }
        })
        .WithName("ListOllamaModels")
        .WithSummary("Lista modelos do Ollama local (instalados e em execução)");
    }

    private static string NormalizeBaseUrl(string? baseUrl)
    {
        var raw = string.IsNullOrWhiteSpace(baseUrl) ? "http://localhost:11434" : baseUrl.Trim();
        return raw.TrimEnd('/');
    }

    private static async Task<string[]> FetchInstalledModelsAsync(HttpClient http, CancellationToken ct)
    {
        using var response = await http.GetAsync("/api/tags", ct);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        if (!doc.RootElement.TryGetProperty("models", out var models) || models.ValueKind != JsonValueKind.Array)
            return Array.Empty<string>();

        return models
            .EnumerateArray()
            .Select(m => m.TryGetProperty("name", out var name) ? name.GetString() : null)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Cast<string>()
            .ToArray();
    }

    private static async Task<string[]> FetchRunningModelsAsync(HttpClient http, CancellationToken ct)
    {
        using var response = await http.GetAsync("/api/ps", ct);
        if (!response.IsSuccessStatusCode)
            return Array.Empty<string>();

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        if (!doc.RootElement.TryGetProperty("models", out var models) || models.ValueKind != JsonValueKind.Array)
            return Array.Empty<string>();

        return models
            .EnumerateArray()
            .Select(m => m.TryGetProperty("name", out var name) ? name.GetString() : null)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Cast<string>()
            .ToArray();
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
