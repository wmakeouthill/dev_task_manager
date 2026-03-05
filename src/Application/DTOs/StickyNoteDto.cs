using DevTaskManager.Domain.Entities;

namespace DevTaskManager.Application.DTOs;

public record StickyNoteDto(
    Guid Id,
    string Title,
    string Content,
    string Color,
    double PositionX,
    double PositionY,
    double Width,
    double Height,
    int ZIndex,
    DateTime CreatedAt,
    DateTime UpdatedAt)
{
    public static StickyNoteDto From(StickyNote n) => new(
        n.Id, n.Title, n.Content, n.Color,
        n.PositionX, n.PositionY, n.Width, n.Height, n.ZIndex,
        n.CreatedAt, n.UpdatedAt);
}

public record CreateStickyNoteRequest(
    string Title,
    string Content,
    string Color,
    double PositionX,
    double PositionY);

public record UpdateStickyNoteRequest(
    string Title,
    string Content,
    string Color);

public record UpdateStickyNotePositionRequest(
    double PositionX,
    double PositionY,
    double Width,
    double Height,
    int ZIndex);

public record AiNoteAssistRequest(
    string Content,
    string Action,
    string? Instruction = null);

public record AiNoteAssistResponse(
    string Content,
    string Provider,
    double DurationMs);
