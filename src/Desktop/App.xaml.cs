using System.IO;
using System.Windows;
using System.Windows.Threading;
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

    private static string LogPath
    {
        get
        {
            var dir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "DevTaskManager", "logs");
            Directory.CreateDirectory(dir);
            return Path.Combine(dir, $"crash-{DateTime.Now:yyyyMMdd}.log");
        }
    }

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        AppDomain.CurrentDomain.UnhandledException += OnUnhandledException;
        DispatcherUnhandledException += OnDispatcherUnhandledException;

        _notificationService = new ReminderNotificationService();
        if (WebApiHostService.IsPackaged)
            _webApiHost = new WebApiHostService();
    }

    private static void OnUnhandledException(object sender, UnhandledExceptionEventArgs e)
    {
        var ex = (Exception)e.ExceptionObject;
        LogAndShow(ex, "UnhandledException");
    }

    private void OnDispatcherUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
    {
        LogAndShow(e.Exception, "DispatcherUnhandledException");
        e.Handled = true;
    }

    private static void LogAndShow(Exception ex, string context)
    {
        try
        {
            var log = $"[{DateTime.Now:O}] {context}\r\n{ex}\r\n\r\n";
            File.AppendAllText(LogPath, log);
        }
        catch { /* ignore */ }

        MessageBox.Show(
            $"Ocorreu um erro:\r\n\r\n{ex.Message}\r\n\r\nDetalhes em: %LocalAppData%\\DevTaskManager\\logs",
            "Dev Task Manager - Erro",
            MessageBoxButton.OK,
            MessageBoxImage.Error);
    }

    protected override void OnExit(ExitEventArgs e)
    {
        _webApiHost?.Dispose();
        _notificationService?.Dispose();
        base.OnExit(e);
    }
}

