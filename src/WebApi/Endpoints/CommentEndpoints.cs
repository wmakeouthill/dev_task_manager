using DevTaskManager.Application.DTOs;
using DevTaskManager.Application.Services;

namespace DevTaskManager.WebApi.Endpoints;

public static class CommentEndpoints
{
    public static void MapCommentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/cards/{cardId:guid}/comments")
            .WithTags("Comments");

        group.MapGet("/", async (Guid cardId, int? page, int? size, ListCommentsService service, CancellationToken ct) =>
        {
            var result = await service.ExecuteAsync(cardId, page ?? 1, Math.Clamp(size ?? 20, 1, 100), ct);
            return Results.Ok(result);
        })
        .WithName("ListComments")
        .WithSummary("Lista comentários do card")
        .Produces<PagedResponse<CommentDto>>();

        group.MapPost("/", async (Guid cardId, CreateCommentRequest request, AddCommentService service, CancellationToken ct) =>
        {
            var comment = await service.ExecuteAsync(cardId, request, ct);
            return Results.Created($"/api/v1/cards/{cardId}/comments/{comment.Id}", comment);
        })
        .WithName("AddComment")
        .WithSummary("Adiciona comentário ao card")
        .Produces<CommentDto>(StatusCodes.Status201Created);

        var byId = app.MapGroup("/comments")
            .WithTags("Comments");

        byId.MapDelete("/{id:guid}", async (Guid id, DeleteCommentService service, CancellationToken ct) =>
        {
            await service.ExecuteAsync(id, ct);
            return Results.NoContent();
        })
        .WithName("DeleteComment")
        .WithSummary("Remove comentário")
        .Produces(StatusCodes.Status204NoContent);
    }
}
