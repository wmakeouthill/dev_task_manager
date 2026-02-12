using System.Diagnostics;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Infrastructure.Ai;

/// <summary>
/// Provider de IA usando Anthropic Claude (Claude 3.5 Sonnet, Haiku, etc).
/// Requer API key do usuário (BYOK).
/// </summary>
public class AnthropicAiProvider : IAiProvider
{
    private readonly HttpClient _http;
    private readonly string _model;
    private const string BaseUrl = "https://api.anthropic.com/v1/messages";

    public string ProviderName => "anthropic";

    public AnthropicAiProvider(string apiKey, string model)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException("Anthropic API key is required.");

        _model = string.IsNullOrWhiteSpace(model) ? "claude-sonnet-4-20250514" : model;
        _http = new HttpClient();
        _http.DefaultRequestHeaders.Add("x-api-key", apiKey.Trim());
        _http.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");
    }

    public async Task<AiResponse> ExecuteAsync(AiRequest request, CancellationToken ct = default)
    {
        var sw = Stopwatch.StartNew();
        var prompt = BuildPrompt(request);

        try
        {
            var body = new
            {
                model = _model,
                max_tokens = 2000,
                system = "Você é um assistente de gerenciamento de tarefas. Responda sempre em português, de forma objetiva e útil.",
                messages = new[]
                {
                    new { role = "user", content = prompt }
                }
            };

            var json = JsonSerializer.Serialize(body);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(BaseUrl, content, ct);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(responseJson);
            var text = doc.RootElement
                .GetProperty("content")[0]
                .GetProperty("text")
                .GetString()?.Trim() ?? "Sem resposta.";

            sw.Stop();
            return new AiResponse(text, ProviderName, sw.Elapsed);
        }
        catch (Exception ex)
        {
            sw.Stop();
            return new AiResponse($"Erro ao consultar Anthropic: {ex.Message}", ProviderName, sw.Elapsed);
        }
    }

    private static string BuildPrompt(AiRequest r)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Ação solicitada: {r.Action}");
        sb.AppendLine($"Card: {r.CardTitle}");
        if (!string.IsNullOrWhiteSpace(r.CardDescription))
            sb.AppendLine($"Descrição: {r.CardDescription}");
        if (!string.IsNullOrWhiteSpace(r.CardStatus))
            sb.AppendLine($"Status: {r.CardStatus}");
        if (r.ChecklistItems?.Count > 0)
        {
            sb.AppendLine("Checklist:");
            foreach (var item in r.ChecklistItems)
                sb.AppendLine($"  - {item}");
        }
        sb.AppendLine();
        sb.AppendLine("Responda em português, de forma objetiva e útil para o desenvolvedor.");
        sb.AppendLine(r.Action.ToLowerInvariant() switch
        {
            "summarize" => "Faça um resumo executivo do card com foco em escopo e progresso.",
            "subtasks" => "Sugira subtarefas práticas para implementar este card.",
            "clarify" => "Liste perguntas para esclarecer requisitos e critérios de aceite.",
            "risk" => "Identifique riscos e dependências e sugira mitigações.",
            "insights" or "board-insights" => "Dê insights sobre priorização e próximos passos.",
            "bottlenecks" => "Identifique gargalos e cards parados.",
            "priorities" => "Sugira prioridades e o que fazer primeiro.",
            "risks" => "Faça análise de riscos.",
            "sprint-review" => "Faça review: o que foi feito, o que falta.",
            "daily-insights" => "Dê insights breves sobre as tarefas do dia.",
            _ => "Comente de forma útil para o time."
        });
        return sb.ToString();
    }
}
