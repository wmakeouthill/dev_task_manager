using DevTaskManager.Domain.Entities;

namespace DevTaskManager.Application.DTOs;

public record ChecklistItemDto(
    Guid Id,
    Guid CardId,
    string Texto,
    bool Concluido,
    int Ordem,
    DateTime CreatedAt)
{
    public static ChecklistItemDto From(ChecklistItem item) =>
        new(item.Id, item.CardId, item.Texto, item.Concluido, item.Ordem, item.CreatedAt);
}

public record CreateChecklistItemRequest(string Texto, int Ordem = 0);

public record UpdateChecklistItemRequest(string? Texto = null, int? Ordem = null);
