using DevTaskManager.Application.DTOs;
using DevTaskManager.Application.Services;

namespace DevTaskManager.WebApi.Endpoints;

public static class WorkspaceEndpoints
{
    public static void MapWorkspaceEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/workspaces")
            .WithTags("Workspaces");

        group.MapGet("/", ListWorkspaces)
            .WithName("ListWorkspaces")
            .WithSummary("Lista workspaces com paginação")
            .Produces<PagedResponse<WorkspaceDto>>();

        group.MapPost("/", CreateWorkspace)
            .WithName("CreateWorkspace")
            .WithSummary("Cria novo workspace")
            .Produces<WorkspaceDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem();

        group.MapGet("/{id:guid}", GetWorkspace)
            .WithName("GetWorkspace")
            .WithSummary("Busca workspace por ID")
            .Produces<WorkspaceDto>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPut("/{id:guid}", UpdateWorkspace)
            .WithName("UpdateWorkspace")
            .WithSummary("Atualiza workspace")
            .Produces<WorkspaceDto>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapDelete("/{id:guid}", DeleteWorkspace)
            .WithName("DeleteWorkspace")
            .WithSummary("Remove workspace")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }

    private static async Task<IResult> ListWorkspaces(
        [AsParameters] PagedQuery query,
        ListWorkspacesService service,
        CancellationToken ct)
    {
        var page = query.Page ?? 1;
        var size = Math.Clamp(query.Size ?? 20, 1, 100);
        var result = await service.ExecuteAsync(page, size, ct);
        return Results.Ok(result);
    }

    private static async Task<IResult> CreateWorkspace(
        CreateWorkspaceRequest request,
        CreateWorkspaceService service,
        CancellationToken ct)
    {
        var workspace = await service.ExecuteAsync(request, ct);
        return Results.Created($"/api/v1/workspaces/{workspace.Id}", workspace);
    }

    private static async Task<IResult> GetWorkspace(
        Guid id,
        GetWorkspaceService service,
        CancellationToken ct)
    {
        var workspace = await service.ExecuteAsync(id, ct);
        return Results.Ok(workspace);
    }

    private static async Task<IResult> UpdateWorkspace(
        Guid id,
        UpdateWorkspaceRequest request,
        UpdateWorkspaceService service,
        CancellationToken ct)
    {
        var workspace = await service.ExecuteAsync(id, request, ct);
        return Results.Ok(workspace);
    }

    private static async Task<IResult> DeleteWorkspace(
        Guid id,
        DeleteWorkspaceService service,
        CancellationToken ct)
    {
        await service.ExecuteAsync(id, ct);
        return Results.NoContent();
    }
}

public record PagedQuery(int? Page, int? Size);
