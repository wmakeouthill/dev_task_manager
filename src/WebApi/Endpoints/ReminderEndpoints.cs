using DevTaskManager.Application.DTOs;
using DevTaskManager.Application.Services;

namespace DevTaskManager.WebApi.Endpoints;

public static class ReminderEndpoints
{
    public static void MapReminderEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/reminders")
            .WithTags("Reminders");

        group.MapGet("/", async (int? page, int? size, ListRemindersService service, CancellationToken ct) =>
        {
            var result = await service.ExecuteAsync(page ?? 1, Math.Clamp(size ?? 20, 1, 100), ct);
            return Results.Ok(result);
        })
        .WithName("ListReminders")
        .WithSummary("Lista lembretes com paginação")
        .Produces<PagedResponse<ReminderDto>>();

        group.MapGet("/pending", async (ListPendingRemindersService service, CancellationToken ct) =>
        {
            var result = await service.ExecuteAsync(ct);
            return Results.Ok(result);
        })
        .WithName("ListPendingReminders")
        .WithSummary("Lista lembretes pendentes que precisam notificar agora")
        .Produces<IReadOnlyList<ReminderDto>>();

        group.MapPost("/", async (CreateReminderRequest request, CreateReminderService service, CancellationToken ct) =>
        {
            var reminder = await service.ExecuteAsync(request, ct);
            return Results.Created($"/api/v1/reminders/{reminder.Id}", reminder);
        })
        .WithName("CreateReminder")
        .WithSummary("Cria novo lembrete")
        .Produces<ReminderDto>(StatusCodes.Status201Created);

        group.MapPatch("/{id:guid}/snooze", async (Guid id, SnoozeReminderRequest request, SnoozeReminderService service, CancellationToken ct) =>
        {
            var reminder = await service.ExecuteAsync(id, request, ct);
            return Results.Ok(reminder);
        })
        .WithName("SnoozeReminder")
        .WithSummary("Adia lembrete")
        .Produces<ReminderDto>();

        group.MapPatch("/{id:guid}/complete", async (Guid id, CompleteReminderService service, CancellationToken ct) =>
        {
            var reminder = await service.ExecuteAsync(id, ct);
            return Results.Ok(reminder);
        })
        .WithName("CompleteReminder")
        .WithSummary("Marca lembrete como concluído")
        .Produces<ReminderDto>();

        group.MapPut("/{id:guid}", async (Guid id, UpdateReminderRequest request, UpdateReminderService service, CancellationToken ct) =>
        {
            var reminder = await service.ExecuteAsync(id, request, ct);
            return Results.Ok(reminder);
        })
        .WithName("UpdateReminder")
        .WithSummary("Edita lembrete")
        .Produces<ReminderDto>();

        group.MapDelete("/{id:guid}", async (Guid id, DeleteReminderService service, CancellationToken ct) =>
        {
            await service.ExecuteAsync(id, ct);
            return Results.NoContent();
        })
        .WithName("DeleteReminder")
        .WithSummary("Exclui lembrete permanentemente")
        .Produces(StatusCodes.Status204NoContent);

        group.MapPatch("/{id:guid}/cancel", async (Guid id, CancelReminderService service, CancellationToken ct) =>
        {
            await service.ExecuteAsync(id, ct);
            return Results.NoContent();
        })
        .WithName("CancelReminder")
        .WithSummary("Cancela lembrete")
        .Produces(StatusCodes.Status204NoContent);
    }
}
