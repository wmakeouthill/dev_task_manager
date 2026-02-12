using DevTaskManager.Application.DTOs;
using DevTaskManager.Domain.Entities;
using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Application.Services;

public class CreateReminderService(IReminderRepository reminderRepo)
{
    public async Task<ReminderDto> ExecuteAsync(CreateReminderRequest request, CancellationToken ct = default)
    {
        var recurrence = Enum.TryParse<ReminderRecurrence>(request.Recurrence, true, out var r)
            ? r : ReminderRecurrence.None;

        var reminder = Reminder.Criar(
            request.Titulo,
            request.ScheduleAt,
            request.CardId,
            request.Descricao,
            recurrence,
            request.RecurrenceDays);

        await reminderRepo.SaveAsync(reminder, ct);
        return ReminderDto.From(reminder);
    }
}

public class ListRemindersService(IReminderRepository reminderRepo)
{
    public async Task<PagedResponse<ReminderDto>> ExecuteAsync(int page, int size, CancellationToken ct = default)
    {
        var (items, total) = await reminderRepo.ListAsync(page, size, ct);
        var totalPages = size > 0 ? (int)Math.Ceiling(total / (double)size) : 0;
        return new PagedResponse<ReminderDto>(
            items.Select(ReminderDto.From).ToList(),
            page,
            size,
            total,
            totalPages,
            page >= totalPages || items.Count < size);
    }
}

public class SnoozeReminderService(IReminderRepository reminderRepo)
{
    public async Task<ReminderDto> ExecuteAsync(Guid id, SnoozeReminderRequest request, CancellationToken ct = default)
    {
        var reminder = await reminderRepo.GetByIdAsync(id, ct)
            ?? throw new EntidadeNaoEncontradaException("Reminder", id);
        reminder.Snooze(request.Until);
        await reminderRepo.UpdateAsync(reminder, ct);
        return ReminderDto.From(reminder);
    }
}

public class CancelReminderService(IReminderRepository reminderRepo)
{
    public async Task ExecuteAsync(Guid id, CancellationToken ct = default)
    {
        var reminder = await reminderRepo.GetByIdAsync(id, ct)
            ?? throw new EntidadeNaoEncontradaException("Reminder", id);
        reminder.Cancel();
        await reminderRepo.UpdateAsync(reminder, ct);
    }
}

public class CompleteReminderService(IReminderRepository reminderRepo)
{
    public async Task<ReminderDto> ExecuteAsync(Guid id, CancellationToken ct = default)
    {
        var reminder = await reminderRepo.GetByIdAsync(id, ct)
            ?? throw new EntidadeNaoEncontradaException("Reminder", id);
        reminder.Complete();
        await reminderRepo.UpdateAsync(reminder, ct);
        return ReminderDto.From(reminder);
    }
}

public class UpdateReminderService(IReminderRepository reminderRepo)
{
    public async Task<ReminderDto> ExecuteAsync(Guid id, UpdateReminderRequest request, CancellationToken ct = default)
    {
        var reminder = await reminderRepo.GetByIdAsync(id, ct)
            ?? throw new EntidadeNaoEncontradaException("Reminder", id);

        var recurrence = request.Recurrence is not null
            ? Enum.TryParse<ReminderRecurrence>(request.Recurrence, true, out var r) ? r : ReminderRecurrence.None
            : (ReminderRecurrence?)null;

        reminder.Atualizar(request.Titulo, request.Descricao, request.ScheduleAt, recurrence, request.RecurrenceDays);
        await reminderRepo.UpdateAsync(reminder, ct);
        return ReminderDto.From(reminder);
    }
}

public class DeleteReminderService(IReminderRepository reminderRepo)
{
    public async Task ExecuteAsync(Guid id, CancellationToken ct = default)
    {
        _ = await reminderRepo.GetByIdAsync(id, ct)
            ?? throw new EntidadeNaoEncontradaException("Reminder", id);
        await reminderRepo.DeleteAsync(id, ct);
    }
}
