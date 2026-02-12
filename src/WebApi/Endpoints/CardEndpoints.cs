using System.ComponentModel.DataAnnotations;
using DevTaskManager.Application.DTOs;
using DevTaskManager.Application.Services;
using DevTaskManager.Domain.Entities;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.WebApi.Endpoints;

public static class CardEndpoints
{
    public static void MapCardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/boards/{boardId:guid}/cards")
            .WithTags("Cards");

        group.MapGet("/", ListCards)
            .WithName("ListCards")
            .WithSummary("Lista cards do board com paginação")
            .Produces<PagedResponse<CardDto>>();

        group.MapPost("/", CreateCard)
            .WithName("CreateCard")
            .WithSummary("Cria novo card no board")
            .Produces<CardDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound);

        var byId = app.MapGroup("/cards")
            .WithTags("Cards");

        byId.MapGet("/search", async (string? q, int? limit, ICardRepository cardRepo, CancellationToken ct) =>
        {
            var cards = await cardRepo.SearchAsync(q ?? "", limit ?? 10, ct);
            var results = cards.Select(c => new CardSearchResult(c.Id, c.Titulo, c.Status.ToString(), c.BoardId)).ToList();
            return Results.Ok(results);
        })
        .WithName("SearchCards")
        .WithSummary("Busca cards por texto no título")
        .Produces<IReadOnlyList<CardSearchResult>>();

        byId.MapGet("/{id:guid}", GetCard)
            .WithName("GetCard")
            .WithSummary("Busca card por ID")
            .Produces<CardDto>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        byId.MapPut("/{id:guid}", UpdateCard)
            .WithName("UpdateCard")
            .WithSummary("Atualiza card")
            .Produces<CardDto>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        byId.MapPatch("/{id:guid}/move", MoveCard)
            .WithName("MoveCard")
            .WithSummary("Move card para outra coluna/ordem")
            .Produces<CardDto>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound);

        byId.MapPatch("/{id:guid}/status", UpdateCardStatus)
            .WithName("UpdateCardStatus")
            .WithSummary("Atualiza status do card")
            .Produces<CardDto>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound);

        byId.MapDelete("/{id:guid}", DeleteCard)
            .WithName("DeleteCard")
            .WithSummary("Remove card")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }

    private static async Task<IResult> ListCards(
        Guid boardId,
        [AsParameters] ListCardsQuery query,
        ListCardsService service,
        CancellationToken ct)
    {
        var page = query.Page ?? 1;
        var size = Math.Clamp(query.Size ?? 20, 1, 100);
        CardStatus? status = null;
        if (!string.IsNullOrEmpty(query.Status) && Enum.TryParse<CardStatus>(query.Status, ignoreCase: true, out var s))
            status = s;
        var result = await service.ExecuteAsync(boardId, page, size, status, ct);
        return Results.Ok(result);
    }

    private static async Task<IResult> CreateCard(
        Guid boardId,
        CreateCardRequest request,
        CreateCardService service,
        CancellationToken ct)
    {
        var card = await service.ExecuteAsync(boardId, request, ct);
        return Results.Created($"/api/v1/cards/{card.Id}", card);
    }

    private static async Task<IResult> GetCard(
        Guid id,
        GetCardService service,
        CancellationToken ct)
    {
        var card = await service.ExecuteAsync(id, ct);
        return Results.Ok(card);
    }

    private static async Task<IResult> UpdateCard(
        Guid id,
        UpdateCardRequest request,
        UpdateCardService service,
        CancellationToken ct)
    {
        var card = await service.ExecuteAsync(id, request, ct);
        return Results.Ok(card);
    }

    private static async Task<IResult> MoveCard(
        Guid id,
        MoveCardRequest request,
        MoveCardService service,
        CancellationToken ct)
    {
        var card = await service.ExecuteAsync(id, request, ct);
        return Results.Ok(card);
    }

    private static async Task<IResult> UpdateCardStatus(
        Guid id,
        UpdateCardStatusRequest request,
        UpdateCardStatusService service,
        CancellationToken ct)
    {
        var card = await service.ExecuteAsync(id, request, ct);
        return Results.Ok(card);
    }

    private static async Task<IResult> DeleteCard(
        Guid id,
        DeleteCardService service,
        CancellationToken ct)
    {
        await service.ExecuteAsync(id, ct);
        return Results.NoContent();
    }
}

public record ListCardsQuery(
    int? Page,
    int? Size,
    [MaxLength(50)] string? Status = null,
    [MaxLength(100)] string? Tag = null);
