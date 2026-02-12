using DevTaskManager.Domain.Entities;

namespace DevTaskManager.Application.DTOs;

public record ReminderDto(
    Guid Id,
    Guid? CardId,
    string Titulo,
    string? Descricao,
    DateTime ScheduleAt,
    string Recurrence,
    int? RecurrenceDays,
    DateTime? SnoozeUntil,
    string Status,
    DateTime CreatedAt)
{
    public static ReminderDto From(Reminder r) => new(
        r.Id, r.CardId, r.Titulo, r.Descricao,
        r.ScheduleAt, r.Recurrence.ToString(), r.RecurrenceDays,
        r.SnoozeUntil, r.Status.ToString(), r.CreatedAt);
}

public record CreateReminderRequest(
    string Titulo,
    DateTime ScheduleAt,
    Guid? CardId = null,
    string? Descricao = null,
    string Recurrence = "None",
    int? RecurrenceDays = null);

public record SnoozeReminderRequest(DateTime Until);

public record UpdateReminderRequest(
    string? Titulo = null,
    string? Descricao = null,
    DateTime? ScheduleAt = null,
    string? Recurrence = null,
    int? RecurrenceDays = null);
