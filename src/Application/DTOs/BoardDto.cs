using DevTaskManager.Domain.Entities;

namespace DevTaskManager.Application.DTOs;

public record BoardDto(
    Guid Id,
    Guid WorkspaceId,
    string Nome,
    DateTime CreatedAt,
    IReadOnlyList<ColumnDto> Columns)
{
    public static BoardDto From(Board b) => new(
        b.Id,
        b.WorkspaceId,
        b.Nome,
        b.CreatedAt,
        b.Columns.Select(ColumnDto.From).ToList());
}
