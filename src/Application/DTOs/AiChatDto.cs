namespace DevTaskManager.Application.DTOs;

/// <summary>Mensagem no histórico de chat IA.</summary>
public record AiChatMessage(string Role, string Content);

/// <summary>Request para o chat IA do card.</summary>
public record AiChatRequest(
    Guid CardId,
    string Message,
    IReadOnlyList<AiChatMessage>? History = null,
    IReadOnlyList<Guid>? ReferencedCardIds = null
);

/// <summary>Sugestão estruturada da IA (descrição ou subtarefas).</summary>
public record AiSuggestion(
    string Type,
    string Content,
    IReadOnlyList<string>? SubtaskItems = null
);

/// <summary>Response do chat IA.</summary>
public record AiChatResponse(
    string Reply,
    IReadOnlyList<AiSuggestion> Suggestions,
    string Provider,
    double DurationMs
);
