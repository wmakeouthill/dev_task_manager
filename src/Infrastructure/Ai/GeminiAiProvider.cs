using System.Diagnostics;
using System.Text;
using DevTaskManager.Domain.Interfaces;
using Google.GenAI;

namespace DevTaskManager.Infrastructure.Ai;

/// <summary>
/// Provider de IA usando Google Gemini para ações no card (summarize, subtasks, clarify, risk, insights).
/// Requer chave de API em configuração "Gemini:ApiKey" ou variável de ambiente GEMINI_API_KEY.
/// </summary>
public class GeminiAiProvider : IAiProvider
{
    private readonly Client? _client;
    public const string DefaultModel = "gemini-2.0-flash";

    public string ProviderName => "gemini";

    public GeminiAiProvider(string? apiKey)
    {
        var key = apiKey?.Trim();
        if (string.IsNullOrEmpty(key))
            key = Environment.GetEnvironmentVariable("GEMINI_API_KEY");

        // Não lança exceção se a chave não estiver configurada — permite que o
        // DI crie a instância sem erro. ExecuteAsync retornará mensagem amigável.
        if (!string.IsNullOrEmpty(key))
            _client = new Client(apiKey: key);
    }

    public async Task<AiResponse> ExecuteAsync(AiRequest request, CancellationToken ct = default)
    {
        var sw = Stopwatch.StartNew();

        if (_client is null)
        {
            return new AiResponse(
                "Chave de API do Gemini não configurada. Vá em Configurações e informe sua API key.",
                ProviderName,
                sw.Elapsed);
        }

        var prompt = BuildPrompt(request);

        try
        {
            var response = await _client.Models.GenerateContentAsync(
                model: DefaultModel,
                contents: prompt);

            sw.Stop();
            var text = response.Candidates?[0].Content?.Parts?[0].Text?.Trim() ?? "Sem resposta.";
            return new AiResponse(text, ProviderName, sw.Elapsed);
        }
        catch (Exception ex)
        {
            sw.Stop();
            var fallback = $"Erro ao consultar Gemini: {ex.Message}";
            return new AiResponse(fallback, ProviderName, sw.Elapsed);
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
        sb.AppendLine("Responda em português, de forma objetiva e útil para o desenvolvedor, conforme a ação:");
        sb.AppendLine(r.Action.ToLowerInvariant() switch
        {
            "summarize" => "Faça um resumo executivo do card com foco em escopo e progresso.",
            "subtasks" => "Sugira subtarefas práticas para implementar este card.",
            "clarify" => "Liste perguntas para esclarecer requisitos e critérios de aceite.",
            "risk" => "Identifique riscos e dependências e sugira mitigações.",
            "insights" => "Dê insights breves sobre priorização e próximos passos para o dia.",
            _ => "Comente o card de forma útil para o time."
        });
        return sb.ToString();
    }
}
