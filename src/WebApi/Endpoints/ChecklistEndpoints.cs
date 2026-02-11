using DevTaskManager.Application.DTOs;
using DevTaskManager.Application.Services;

namespace DevTaskManager.WebApi.Endpoints;

public static class ChecklistEndpoints
{
    public static void MapChecklistEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/cards/{cardId:guid}/checklist")
            .WithTags("Checklist");

        group.MapGet("/", async (Guid cardId, ListChecklistItemsService service, CancellationToken ct) =>
        {
            var items = await service.ExecuteAsync(cardId, ct);
            return Results.Ok(items);
        })
        .WithName("ListChecklistItems")
        .WithSummary("Lista itens de checklist do card")
        .Produces<IReadOnlyList<ChecklistItemDto>>();

        group.MapPost("/", async (Guid cardId, CreateChecklistItemRequest request, AddChecklistItemService service, CancellationToken ct) =>
        {
            var item = await service.ExecuteAsync(cardId, request, ct);
            return Results.Created($"/api/v1/cards/{cardId}/checklist/{item.Id}", item);
        })
        .WithName("AddChecklistItem")
        .WithSummary("Adiciona item ao checklist")
        .Produces<ChecklistItemDto>(StatusCodes.Status201Created);

        var byId = app.MapGroup("/checklist")
            .WithTags("Checklist");

        byId.MapPatch("/{itemId:guid}/toggle", async (Guid itemId, ToggleChecklistItemService service, CancellationToken ct) =>
        {
            var item = await service.ExecuteAsync(itemId, ct);
            return Results.Ok(item);
        })
        .WithName("ToggleChecklistItem")
        .WithSummary("Alterna conclusão do item")
        .Produces<ChecklistItemDto>();

        byId.MapDelete("/{itemId:guid}", async (Guid itemId, DeleteChecklistItemService service, CancellationToken ct) =>
        {
            await service.ExecuteAsync(itemId, ct);
            return Results.NoContent();
        })
        .WithName("DeleteChecklistItem")
        .WithSummary("Remove item do checklist")
        .Produces(StatusCodes.Status204NoContent);
    }
}
