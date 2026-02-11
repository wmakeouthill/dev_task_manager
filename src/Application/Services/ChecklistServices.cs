using DevTaskManager.Application.DTOs;
using DevTaskManager.Domain.Entities;
using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Application.Services;

public class AddChecklistItemService(IChecklistItemRepository checklistRepo, ICardRepository cardRepo)
{
    public async Task<ChecklistItemDto> ExecuteAsync(Guid cardId, CreateChecklistItemRequest request, CancellationToken ct = default)
    {
        _ = await cardRepo.GetByIdAsync(cardId, ct)
            ?? throw new EntidadeNaoEncontradaException("Card", cardId);

        var item = ChecklistItem.Criar(cardId, request.Texto, request.Ordem);
        await checklistRepo.SaveAsync(item, ct);
        return ChecklistItemDto.From(item);
    }
}

public class ListChecklistItemsService(IChecklistItemRepository checklistRepo)
{
    public async Task<IReadOnlyList<ChecklistItemDto>> ExecuteAsync(Guid cardId, CancellationToken ct = default)
    {
        var items = await checklistRepo.ListByCardAsync(cardId, ct);
        return items.Select(ChecklistItemDto.From).ToList();
    }
}

public class ToggleChecklistItemService(IChecklistItemRepository checklistRepo)
{
    public async Task<ChecklistItemDto> ExecuteAsync(Guid itemId, CancellationToken ct = default)
    {
        var item = await checklistRepo.GetByIdAsync(itemId, ct)
            ?? throw new EntidadeNaoEncontradaException("ChecklistItem", itemId);
        item.Toggle();
        await checklistRepo.UpdateAsync(item, ct);
        return ChecklistItemDto.From(item);
    }
}

public class DeleteChecklistItemService(IChecklistItemRepository checklistRepo)
{
    public async Task ExecuteAsync(Guid id, CancellationToken ct = default)
    {
        _ = await checklistRepo.GetByIdAsync(id, ct)
            ?? throw new EntidadeNaoEncontradaException("ChecklistItem", id);
        await checklistRepo.DeleteAsync(id, ct);
    }
}
