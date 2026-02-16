using System.Diagnostics;
using System.Text;
using System.Text.Json;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Infrastructure.Ai;

/// <summary>
/// Provider de IA usando Ollama local. Não requer API key.
/// </summary>
public class OllamaAiProvider : IAiProvider
{
    private const int DefaultNumCtx = 20000;
    private const double DefaultTemperature = 0.2;
    private readonly HttpClient _http;
    private readonly string _model;
    private readonly int _numCtx;

    public string ProviderName => "ollama";

    public OllamaAiProvider(string baseUrl, string model)
    {
        _model = string.IsNullOrWhiteSpace(model) ? "llama3" : model;
        var configuredNumCtx = Environment.GetEnvironmentVariable("OLLAMA_NUM_CTX");
        _numCtx = int.TryParse(configuredNumCtx, out var parsed) && parsed > 0
            ? parsed
            : DefaultNumCtx;
        _http = new HttpClient { BaseAddress = new Uri(baseUrl.TrimEnd('/')) };
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
                messages = new[]
                {
                    new
                    {
                        role = "system",
                        content = "Você é um assistente técnico de gestão de tarefas. Responda sempre em português do Brasil, de forma objetiva, prática e acionável. Siga rigorosamente instruções de formato do usuário/contexto. Quando houver sugestão aplicável para descrição ou subtarefas, use os delimitadores esperados pelo sistema (<<<DESCRICAO>>>...<<<FIM_DESCRICAO>>> e <<<SUBTAREFAS>>>...<<<FIM_SUBTAREFAS>>>)."
                    },
                    new { role = "user", content = prompt }
                },
                stream = false,
                options = new
                {
                    num_ctx = _numCtx,
                    temperature = DefaultTemperature
                }
            };

            var json = JsonSerializer.Serialize(body);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _http.PostAsync("/api/chat", content, ct);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(responseJson);
            var text = doc.RootElement
                .GetProperty("message")
                .GetProperty("content")
                .GetString()?.Trim() ?? "Sem resposta.";

            sw.Stop();
            return new AiResponse(text, ProviderName, sw.Elapsed);
        }
        catch (Exception ex)
        {
            sw.Stop();
            return new AiResponse($"Erro ao consultar Ollama: {ex.Message}", ProviderName, sw.Elapsed);
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
            "summarize" => "Faça um resumo executivo do card.",
            "subtasks" => "Sugira subtarefas práticas.",
            "clarify" => "Liste perguntas para esclarecer requisitos.",
            "risk" => "Identifique riscos e mitigações.",
            "insights" or "board-insights" => "Dê insights sobre priorização.",
            "bottlenecks" => "Identifique gargalos.",
            "priorities" => "Sugira prioridades.",
            "risks" => "Análise de riscos.",
            "sprint-review" => "Faça review do progresso.",
            "daily-insights" => "Insights sobre as tarefas do dia.",
            _ => "Comente de forma útil."
        });
        return sb.ToString();
    }
}
