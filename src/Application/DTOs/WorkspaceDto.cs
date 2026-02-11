using DevTaskManager.Domain.Entities;

namespace DevTaskManager.Application.DTOs;

public record WorkspaceDto(
    Guid Id,
    string Nome,
    string OwnerId,
    DateTime CreatedAt)
{
    public static WorkspaceDto From(Workspace w) => new(w.Id, w.Nome, w.OwnerId, w.CreatedAt);
}
