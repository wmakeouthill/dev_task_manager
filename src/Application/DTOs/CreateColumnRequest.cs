namespace DevTaskManager.Application.DTOs;

public record CreateColumnRequest(string Nome, int? Ordem = null);
