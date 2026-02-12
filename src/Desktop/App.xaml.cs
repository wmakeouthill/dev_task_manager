using System.Windows;
using DevTaskManager.Desktop.Services;

namespace DevTaskManager.Desktop;

/// <summary>
/// Interaction logic for App.xaml
/// </summary>
public partial class App : Application
{
    private ReminderNotificationService? _notificationService;
    private WebApiHostService? _webApiHost;

    internal WebApiHostService? WebApiHost => _webApiHost;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);
        _notificationService = new ReminderNotificationService();
        if (WebApiHostService.IsPackaged)
            _webApiHost = new WebApiHostService();
    }

    protected override void OnExit(ExitEventArgs e)
    {
        _webApiHost?.Dispose();
        _notificationService?.Dispose();
        base.OnExit(e);
    }
}

