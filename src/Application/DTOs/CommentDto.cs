using DevTaskManager.Domain.Entities;

namespace DevTaskManager.Application.DTOs;

public record CommentDto(
    Guid Id,
    Guid CardId,
    string Autor,
    string Texto,
    DateTime CreatedAt)
{
    public static CommentDto From(Comment c) => new(c.Id, c.CardId, c.Autor, c.Texto, c.CreatedAt);
}

public record CreateCommentRequest(string Texto, string? Autor = null);
