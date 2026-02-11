using DevTaskManager.Domain.Exceptions;

namespace DevTaskManager.Domain.Entities;

public enum ReminderStatus
{
    Pending = 0,
    Triggered = 1,
    Cancelled = 2
}

public enum ReminderRecurrence
{
    None = 0,
    Daily = 1,
    Weekly = 2,
    Custom = 3
}

public class Reminder
{
    public Guid Id { get; private set; }
    public Guid? CardId { get; private set; }
    public string Titulo { get; private set; } = string.Empty;
    public string? Descricao { get; private set; }
    public DateTime ScheduleAt { get; private set; }
    public ReminderRecurrence Recurrence { get; private set; }
    public int? RecurrenceDays { get; private set; }
    public DateTime? SnoozeUntil { get; private set; }
    public ReminderStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private Reminder() { }

    public static Reminder Criar(string titulo, DateTime scheduleAt, Guid? cardId = null, string? descricao = null, ReminderRecurrence recurrence = ReminderRecurrence.None, int? recurrenceDays = null)
    {
        if (string.IsNullOrWhiteSpace(titulo))
            throw new RegraDeNegocioException("Título do lembrete é obrigatório.");

        if (scheduleAt < DateTime.UtcNow.AddMinutes(-1))
            throw new RegraDeNegocioException("Data do lembrete não pode ser no passado.");

        return new Reminder
        {
            Id = Guid.NewGuid(),
            CardId = cardId,
            Titulo = titulo.Trim(),
            Descricao = descricao?.Trim(),
            ScheduleAt = scheduleAt,
            Recurrence = recurrence,
            RecurrenceDays = recurrenceDays,
            Status = ReminderStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Trigger()
    {
        if (Status != ReminderStatus.Pending)
            throw new RegraDeNegocioException("Lembrete não está pendente.");

        Status = ReminderStatus.Triggered;

        if (Recurrence != ReminderRecurrence.None)
        {
            var next = Recurrence switch
            {
                ReminderRecurrence.Daily => ScheduleAt.AddDays(1),
                ReminderRecurrence.Weekly => ScheduleAt.AddDays(7),
                ReminderRecurrence.Custom => ScheduleAt.AddDays(RecurrenceDays ?? 1),
                _ => (DateTime?)null
            };

            if (next.HasValue)
            {
                ScheduleAt = next.Value;
                Status = ReminderStatus.Pending;
            }
        }
    }

    public void Snooze(DateTime until)
    {
        if (until <= DateTime.UtcNow)
            throw new RegraDeNegocioException("Data de snooze deve ser no futuro.");
        SnoozeUntil = until;
        Status = ReminderStatus.Pending;
    }

    public void Cancel()
    {
        Status = ReminderStatus.Cancelled;
    }
}
