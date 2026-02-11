namespace DevTaskManager.Domain.Interfaces;

public record AiRequest(string Action, string CardTitle, string? CardDescription, string? CardStatus, IReadOnlyList<string>? ChecklistItems);

public record AiResponse(string Content, string Provider, TimeSpan Duration);

public interface IAiProvider
{
    Task<AiResponse> ExecuteAsync(AiRequest request, CancellationToken ct = default);
    string ProviderName { get; }
}
