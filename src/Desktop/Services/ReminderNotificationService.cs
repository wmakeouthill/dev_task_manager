using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Toolkit.Uwp.Notifications;

namespace DevTaskManager.Desktop.Services;

/// <summary>
/// Polls the WebAPI for pending reminders and shows Windows toast notifications.
/// Lembretes pendentes reaparecem a cada ~1 minuto até o usuário tomar uma ação
/// (concluir, cancelar ou adiar). Dispensar o toast no Windows NÃO impede que
/// ele reapareça — somente ações via API alteram o status ou o horário.
/// </summary>
public sealed class ReminderNotificationService : IDisposable
{
    private readonly HttpClient _http;
    private readonly Timer _timer;
    private readonly TimeSpan _pollInterval = TimeSpan.FromSeconds(30);
    private readonly TimeSpan _renotifyInterval = TimeSpan.FromSeconds(60);
    private readonly Dictionary<string, DateTime> _lastNotifiedAt = [];
    private bool _disposed;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public ReminderNotificationService()
    {
        _http = new HttpClient
        {
            BaseAddress = GetApiBaseAddress(),
            Timeout = TimeSpan.FromSeconds(10)
        };

        // Aguarda 10s antes do primeiro poll — dá tempo para a API inicializar
        _timer = new Timer(PollReminders, null, TimeSpan.FromSeconds(10), _pollInterval);
    }

    private static Uri GetApiBaseAddress()
    {
        var configured = Environment.GetEnvironmentVariable("DEV_TASK_MANAGER_API_URL");
        if (!string.IsNullOrWhiteSpace(configured))
        {
            return new Uri(configured, UriKind.Absolute);
        }

        // Mesma porta usada pela WebAPI (launchSettings + WebApiHostService)
        return new Uri("http://localhost:5011/api/v1/", UriKind.Absolute); // NOSONAR
    }

    private async void PollReminders(object? state)
    {
        if (_disposed) return;

        try
        {
            var response = await _http.GetAsync("reminders?page=1&pageSize=50");
            if (!response.IsSuccessStatusCode) return;

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<PagedResult<ReminderDto>>(json, JsonOptions);
            if (result?.Content is null) return;

            var now = DateTime.UtcNow;

            // Remove IDs de lembretes que não estão mais na lista (foram cancelados/concluídos)
            var activeIds = new HashSet<string>();

            foreach (var reminder in result.Content)
            {
                if (!string.Equals(reminder.Status, "Pending", StringComparison.OrdinalIgnoreCase)
                    || reminder.ScheduleAt > now)
                    continue;

                activeIds.Add(reminder.Id);

                // Re-notifica se nunca notificou OU se já passou o intervalo (1 min)
                // Dispensar o toast no Windows não impede a re-notificação!
                if (!_lastNotifiedAt.TryGetValue(reminder.Id, out var lastShown)
                    || (now - lastShown) >= _renotifyInterval)
                {
                    ShowToast(reminder);
                    _lastNotifiedAt[reminder.Id] = now;
                }
            }

            // Limpa tracking de lembretes que não são mais pendentes
            // (usuário concluiu, cancelou ou adiou)
            foreach (var id in _lastNotifiedAt.Keys.ToArray())
            {
                if (!activeIds.Contains(id))
                    _lastNotifiedAt.Remove(id);
            }
        }
        catch
        {
            // Silently ignore — API may not be running yet
        }
    }

    private static void ShowToast(ReminderDto reminder)
    {
        new ToastContentBuilder()
            .AddArgument("action", "viewReminder")
            .AddArgument("reminderId", reminder.Id)
            .AddText("🔔 Dev Task Manager")
            .AddText(reminder.Titulo)
            .AddText(reminder.Descricao ?? string.Empty)
            .Show();
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;

        // Para o timer imediatamente para evitar callbacks após dispose
        _timer.Change(Timeout.Infinite, Timeout.Infinite);
        _timer.Dispose();
        _http.Dispose();
        _lastNotifiedAt.Clear();
    }

    // Lightweight DTOs for deserialization
    private sealed class PagedResult<T>
    {
        public List<T>? Content { get; set; }
    }

    private sealed class ReminderDto
    {
        public string Id { get; set; } = string.Empty;
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime ScheduleAt { get; set; } = DateTime.MinValue;
    }
}
