using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Toolkit.Uwp.Notifications;

namespace DevTaskManager.Desktop.Services;

/// <summary>
/// Polls the WebAPI for pending reminders and shows Windows toast notifications.
/// </summary>
public sealed class ReminderNotificationService : IDisposable
{
    private readonly HttpClient _http;
    private readonly Timer _timer;
    private readonly TimeSpan _interval = TimeSpan.FromSeconds(30);
    private bool _disposed;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public ReminderNotificationService()
    {
        _http = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:5000/api/v1/"),
            Timeout = TimeSpan.FromSeconds(10)
        };

        _timer = new Timer(PollReminders, null, TimeSpan.FromSeconds(5), _interval);
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
            foreach (var reminder in result.Content)
            {
                if (string.Equals(reminder.Status, "Pending", StringComparison.OrdinalIgnoreCase)
                    && reminder.ScheduledAt <= now)
                {
                    ShowToast(reminder);
                }
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
            .AddText("⏰ Lembrete — Dev Task Manager")
            .AddText(reminder.Mensagem)
            .SetToastScenario(ToastScenario.Reminder)
            .Show();
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _timer.Dispose();
        _http.Dispose();
    }

    // Lightweight DTOs for deserialization
    private sealed class PagedResult<T>
    {
        public List<T>? Content { get; set; }
        public int TotalElements { get; set; }
    }

    private sealed class ReminderDto
    {
        public string Id { get; set; } = string.Empty;
        public string Mensagem { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime ScheduledAt { get; set; }
    }
}
