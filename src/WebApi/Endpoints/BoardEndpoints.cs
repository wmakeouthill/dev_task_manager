using DevTaskManager.Application.DTOs;
using DevTaskManager.Application.Services;

namespace DevTaskManager.WebApi.Endpoints;

public static class BoardEndpoints
{
    public static void MapBoardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/workspaces/{workspaceId:guid}/boards")
            .WithTags("Boards");

        group.MapGet("/", ListBoards)
            .WithName("ListBoards")
            .WithSummary("Lista boards do workspace com paginação")
            .Produces<PagedResponse<BoardDto>>();

        group.MapPost("/", CreateBoard)
            .WithName("CreateBoard")
            .WithSummary("Cria novo board no workspace")
            .Produces<BoardDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound);

        var byId = app.MapGroup("/boards")
            .WithTags("Boards");

        byId.MapGet("/{id:guid}", GetBoard)
            .WithName("GetBoard")
            .WithSummary("Busca board por ID")
            .Produces<BoardDto>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        byId.MapPut("/{id:guid}", UpdateBoard)
            .WithName("UpdateBoard")
            .WithSummary("Atualiza board")
            .Produces<BoardDto>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound);

        byId.MapDelete("/{id:guid}", DeleteBoard)
            .WithName("DeleteBoard")
            .WithSummary("Remove board")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }

    private static async Task<IResult> ListBoards(
        Guid workspaceId,
        [AsParameters] PagedQuery query,
        ListBoardsService service,
        CancellationToken ct)
    {
        var page = query.Page ?? 1;
        var size = Math.Clamp(query.Size ?? 20, 1, 100);
        var result = await service.ExecuteAsync(workspaceId, page, size, ct);
        return Results.Ok(result);
    }

    private static async Task<IResult> CreateBoard(
        Guid workspaceId,
        CreateBoardRequest request,
        CreateBoardService service,
        CancellationToken ct)
    {
        var board = await service.ExecuteAsync(workspaceId, request, ct);
        return Results.Created($"/api/v1/boards/{board.Id}", board);
    }

    private static async Task<IResult> GetBoard(
        Guid id,
        GetBoardService service,
        CancellationToken ct)
    {
        var board = await service.ExecuteAsync(id, ct);
        return Results.Ok(board);
    }

    private static async Task<IResult> UpdateBoard(
        Guid id,
        UpdateBoardRequest request,
        UpdateBoardService service,
        CancellationToken ct)
    {
        var board = await service.ExecuteAsync(id, request, ct);
        return Results.Ok(board);
    }

    private static async Task<IResult> DeleteBoard(
        Guid id,
        DeleteBoardService service,
        CancellationToken ct)
    {
        await service.ExecuteAsync(id, ct);
        return Results.NoContent();
    }
}
