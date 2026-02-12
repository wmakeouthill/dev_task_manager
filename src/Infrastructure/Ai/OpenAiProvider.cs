using System.Diagnostics;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Infrastructure.Ai;

/// <summary>
/// Provider de IA usando OpenAI (GPT-4o, GPT-3.5-turbo, etc).
/// Requer API key do usuário (BYOK).
/// </summary>
public class OpenAiProvider : IAiProvider
{
    private readonly HttpClient _http;
    private readonly string _model;
    private const string BaseUrl = "https://api.openai.com/v1/chat/completions";

    public string ProviderName => "openai";

    public OpenAiProvider(string apiKey, string model)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException("OpenAI API key is required.");

        _model = string.IsNullOrWhiteSpace(model) ? "gpt-4o-mini" : model;
        _http = new HttpClient();
        _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey.Trim());
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
                    new { role = "system", content = "Você é um assistente de gerenciamento de tarefas. Responda sempre em português, de forma objetiva e útil." },
                    new { role = "user", content = prompt }
                },
                temperature = 0.7,
                max_tokens = 2000
            };

            var json = JsonSerializer.Serialize(body);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _http.PostAsync(BaseUrl, content, ct);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(responseJson);
            var text = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString()?.Trim() ?? "Sem resposta.";

            sw.Stop();
            return new AiResponse(text, ProviderName, sw.Elapsed);
        }
        catch (Exception ex)
        {
            sw.Stop();
            return new AiResponse($"Erro ao consultar OpenAI: {ex.Message}", ProviderName, sw.Elapsed);
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
        sb.AppendLine(GetActionInstruction(r.Action));
        return sb.ToString();
    }

    private static string GetActionInstruction(string action) => action.ToLowerInvariant() switch
    {
        "summarize" => "Faça um resumo executivo do card com foco em escopo e progresso.",
        "subtasks" => "Sugira subtarefas práticas para implementar este card.",
        "clarify" => "Liste perguntas para esclarecer requisitos e critérios de aceite.",
        "risk" => "Identifique riscos e dependências e sugira mitigações.",
        "insights" or "board-insights" => "Dê insights sobre priorização e próximos passos.",
        "bottlenecks" => "Identifique gargalos e cards parados. Sugira ações.",
        "priorities" => "Sugira prioridades e o que fazer primeiro.",
        "risks" => "Faça análise de riscos: dependências, prazos, complexidade.",
        "sprint-review" => "Faça review: o que foi feito, o que falta, progresso geral.",
        "daily-insights" => "Dê insights breves sobre as tarefas do dia: prioridades, riscos, foco.",
        _ => "Comente de forma útil para o time."
    };
}
