using DevTaskManager.Application.DTOs;
using DevTaskManager.Application.Services;

namespace DevTaskManager.WebApi.Endpoints;

public static class ColumnEndpoints
{
    public static void MapColumnEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/boards/{boardId:guid}/columns")
            .WithTags("Columns");

        group.MapPost("/", AddColumn)
            .WithName("AddColumn")
            .WithSummary("Adiciona coluna ao board")
            .Produces<ColumnDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound);

        var byId = app.MapGroup("/columns")
            .WithTags("Columns");

        byId.MapPut("/{id:guid}", UpdateColumn)
            .WithName("UpdateColumn")
            .WithSummary("Atualiza coluna")
            .Produces<ColumnDto>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound);

        byId.MapDelete("/{id:guid}", DeleteColumn)
            .WithName("DeleteColumn")
            .WithSummary("Remove coluna")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);

        byId.MapPost("/{id:guid}/move", MoveColumn)
            .WithName("MoveColumn")
            .WithSummary("Reordena coluna")
            .Produces<ColumnDto>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound);
    }

    private static async Task<IResult> AddColumn(
        Guid boardId,
        CreateColumnRequest request,
        AddColumnService service,
        CancellationToken ct)
    {
        var column = await service.ExecuteAsync(boardId, request, ct);
        return Results.Created($"/api/v1/columns/{column.Id}", column);
    }

    private static async Task<IResult> UpdateColumn(
        Guid id,
        UpdateColumnRequest request,
        UpdateColumnService service,
        CancellationToken ct)
    {
        var column = await service.ExecuteAsync(id, request, ct);
        return Results.Ok(column);
    }

    private static async Task<IResult> DeleteColumn(
        Guid id,
        DeleteColumnService service,
        CancellationToken ct)
    {
        await service.ExecuteAsync(id, ct);
        return Results.NoContent();
    }

    private static async Task<IResult> MoveColumn(
        Guid id,
        MoveColumnRequest request,
        MoveColumnService service,
        CancellationToken ct)
    {
        var column = await service.ExecuteAsync(id, request, ct);
        return Results.Ok(column);
    }
}
