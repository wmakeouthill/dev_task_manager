using System.Windows;
using DevTaskManager.Desktop.Services;

namespace DevTaskManager.Desktop;

/// <summary>
/// Interaction logic for App.xaml
/// </summary>
public partial class App : Application
{
    private ReminderNotificationService? _notificationService;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);
        _notificationService = new ReminderNotificationService();
    }

    protected override void OnExit(ExitEventArgs e)
    {
        _notificationService?.Dispose();
        base.OnExit(e);
    }
}

