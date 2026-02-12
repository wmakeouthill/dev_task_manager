using DevTaskManager.Application.DTOs;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Application.Services;

/// <summary>
/// Lista lembretes que estão pendentes e já passaram do horário programado.
/// Usado pelo frontend para disparar notificações nativas do Windows.
/// </summary>
public class ListPendingRemindersService(IReminderRepository reminderRepo)
{
    public async Task<IReadOnlyList<ReminderDto>> ExecuteAsync(CancellationToken ct = default)
    {
        var pending = await reminderRepo.GetPendingAsync(DateTime.UtcNow, ct);
        return pending.Select(ReminderDto.From).ToList();
    }
}
