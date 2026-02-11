namespace DevTaskManager.Application.DTOs;

public record UpdateCardRequest(string? Titulo, string? Descricao, DateTime? DueDate);
