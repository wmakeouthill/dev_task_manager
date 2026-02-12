using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Infrastructure.Ai;

/// <summary>
/// Factory que cria instâncias de IAiProvider conforme o provider/key recebidos.
/// Permite multi-provider (BYOK — Bring Your Own Key).
/// </summary>
public class AiProviderFactory
{
    public IAiProvider Create(string provider, string apiKey, string model, string? baseUrl = null)
    {
        return provider.ToLowerInvariant() switch
        {
            "openai" => new OpenAiProvider(apiKey, model),
            "anthropic" => new AnthropicAiProvider(apiKey, model),
            "gemini" => new GeminiAiProvider(apiKey),
            "ollama" => new OllamaAiProvider(baseUrl ?? "http://localhost:11434", model),
            _ => throw new ArgumentException($"Provider '{provider}' não suportado. Use: openai, anthropic, gemini, ollama.")
        };
    }

    /// <summary>
    /// Tenta criar um provider a partir de parâmetros extraídos dos headers. Retorna fallback se dados insuficientes.
    /// </summary>
    public IAiProvider? TryCreate(string? providerName, string? apiKey, string? model, string? baseUrl, IAiProvider? fallback = null)
    {
        if (string.IsNullOrWhiteSpace(providerName))
            return fallback;

        if (string.IsNullOrWhiteSpace(apiKey) && providerName != "ollama")
            return fallback;

        return Create(providerName, apiKey ?? "", model ?? "", baseUrl);
    }
}
