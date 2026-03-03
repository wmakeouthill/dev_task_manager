using DevTaskManager.Application.DTOs;
using DevTaskManager.Application.Services;
using DevTaskManager.Domain.Interfaces;
using DevTaskManager.Infrastructure.Ai;

namespace DevTaskManager.WebApi.Endpoints;

public static class StickyNoteEndpoints
{
    public static void MapStickyNoteEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/notes")
            .WithTags("StickyNotes");

        group.MapGet("/", async (StickyNoteService service, CancellationToken ct) =>
        {
            var notes = await service.ListAsync(ct);
            return Results.Ok(notes);
        })
        .WithName("ListStickyNotes")
        .WithSummary("Lista todas as sticky notes")
        .Produces<IReadOnlyList<StickyNoteDto>>();

        group.MapPost("/", async (CreateStickyNoteRequest request, StickyNoteService service, CancellationToken ct) =>
        {
            var note = await service.CreateAsync(request, ct);
            return Results.Created($"/api/v1/notes/{note.Id}", note);
        })
        .WithName("CreateStickyNote")
        .WithSummary("Cria nova sticky note")
        .Produces<StickyNoteDto>(StatusCodes.Status201Created);

        group.MapGet("/{id:guid}", async (Guid id, StickyNoteService service, CancellationToken ct) =>
        {
            var note = await service.GetAsync(id, ct);
            return Results.Ok(note);
        })
        .WithName("GetStickyNote")
        .WithSummary("Busca sticky note por ID")
        .Produces<StickyNoteDto>()
        .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPut("/{id:guid}", async (Guid id, UpdateStickyNoteRequest request, StickyNoteService service, CancellationToken ct) =>
        {
            var note = await service.UpdateAsync(id, request, ct);
            return Results.Ok(note);
        })
        .WithName("UpdateStickyNote")
        .WithSummary("Atualiza conteúdo da sticky note")
        .Produces<StickyNoteDto>()
        .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPatch("/{id:guid}/position", async (Guid id, UpdateStickyNotePositionRequest request, StickyNoteService service, CancellationToken ct) =>
        {
            var note = await service.UpdatePositionAsync(id, request, ct);
            return Results.Ok(note);
        })
        .WithName("UpdateStickyNotePosition")
        .WithSummary("Atualiza posição e tamanho da sticky note")
        .Produces<StickyNoteDto>()
        .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapDelete("/{id:guid}", async (Guid id, StickyNoteService service, CancellationToken ct) =>
        {
            await service.DeleteAsync(id, ct);
            return Results.NoContent();
        })
        .WithName("DeleteStickyNote")
        .WithSummary("Remove sticky note")
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/ai-assist", async (
            AiNoteAssistRequest request,
            AiNoteAssistService aiService,
            AiProviderFactory providerFactory,
            IAiProvider defaultProvider,
            HttpContext http,
            CancellationToken ct) =>
        {
            var providerName = http.Request.Headers["X-AI-Provider"].ToString();
            var apiKey = http.Request.Headers["X-AI-ApiKey"].ToString();
            var model = http.Request.Headers["X-AI-Model"].ToString();
            var baseUrl = http.Request.Headers["X-AI-BaseUrl"].ToString();
            var provider = providerFactory.TryCreate(providerName, apiKey, model, baseUrl, defaultProvider)!;
            var response = await aiService.ExecuteAsync(request, provider, ct);
            return Results.Ok(response);
        })
        .WithName("AiNoteAssist")
        .WithSummary("Solicita assistência de IA para uma sticky note (help, fix, organize, expand)")
        .Produces<AiNoteAssistResponse>();
    }
}
