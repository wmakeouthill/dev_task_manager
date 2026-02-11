using DevTaskManager.Domain.Entities;

namespace DevTaskManager.Application.DTOs;

public record ColumnDto(
    Guid Id,
    Guid BoardId,
    string Nome,
    int Ordem,
    int? WipLimit)
{
    public static ColumnDto From(Column c) => new(c.Id, c.BoardId, c.Nome, c.Ordem, c.WipLimit);
}
