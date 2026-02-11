using DevTaskManager.Domain.Entities;

namespace DevTaskManager.Application.DTOs;

public record CardDto(
    Guid Id,
    Guid BoardId,
    Guid ColumnId,
    string Titulo,
    string? Descricao,
    string Status,
    int Ordem,
    DateTime? DueDate,
    DateTime CreatedAt)
{
    public static CardDto From(Card c) => new(
        c.Id,
        c.BoardId,
        c.ColumnId,
        c.Titulo,
        c.Descricao,
        c.Status.ToString(),
        c.Ordem,
        c.DueDate,
        c.CreatedAt);
}
