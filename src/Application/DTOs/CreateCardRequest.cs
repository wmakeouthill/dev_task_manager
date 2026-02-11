namespace DevTaskManager.Application.DTOs;

public record CreateCardRequest(Guid ColumnId, string Titulo, string? Descricao = null, int Ordem = 0);
