namespace DevTaskManager.Application.DTOs;

/// <summary>Resultado de busca de cards (leve, para referenciar no chat).</summary>
public record CardSearchResult(Guid Id, string Titulo, string Status, Guid BoardId);
