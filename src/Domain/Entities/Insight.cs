using DevTaskManager.Domain.Exceptions;

namespace DevTaskManager.Domain.Entities;

public class Insight
{
    public Guid Id { get; private set; }
    public Guid CardId { get; private set; }
    public string CardTitle { get; private set; } = string.Empty;
    public string Status { get; private set; } = string.Empty;
    public string Content { get; private set; } = string.Empty;
    public string Provider { get; private set; } = string.Empty;
    public string Action { get; private set; } = string.Empty;
    public double DurationMs { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private Insight() { }

    public static Insight Criar(
        Guid cardId, string cardTitle, string status,
        string content, string provider, string action, double durationMs)
    {
        if (string.IsNullOrWhiteSpace(content))
            throw new RegraDeNegocioException("Conteúdo do insight é obrigatório.");

        return new Insight
        {
            Id = Guid.NewGuid(),
            CardId = cardId,
            CardTitle = cardTitle.Trim(),
            Status = status,
            Content = content,
            Provider = provider,
            Action = action,
            DurationMs = durationMs,
            CreatedAt = DateTime.UtcNow
        };
    }
}
