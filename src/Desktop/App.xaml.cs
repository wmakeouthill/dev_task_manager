using System.IO;
using System.Threading;
using System.Windows;
using System.Windows.Threading;
using DevTaskManager.Desktop.Services;
using Microsoft.Toolkit.Uwp.Notifications;

namespace DevTaskManager.Desktop;

/// <summary>
/// Interaction logic for App.xaml
/// </summary>
public partial class App : Application
{
    private ReminderNotificationService? _notificationService;
    private WebApiHostService? _webApiHost;
    private static Mutex? _mutex;

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
        // ── Instância única ──────────────────────────────────────────────
        // Impede que cliques em toasts ou atalhos abram uma segunda janela
        _mutex = new Mutex(true, @"Local\DevTaskManager.Desktop", out var isFirst);
        if (!isFirst)
        {
            _mutex.Dispose();
            _mutex = null;
            Shutdown(0);
            return;
        }

        base.OnStartup(e);

        // ── Tratamento global de erros ───────────────────────────────────
        AppDomain.CurrentDomain.UnhandledException += OnUnhandledException;
        DispatcherUnhandledException += OnDispatcherUnhandledException;

        // ── Registro de notificações (AUMID + atalho no Menu Iniciar) ───
        ToastRegistrationService.Register();

        // Handler de ativação por toast — DEVE ser registrado antes de
        // qualquer Show(). Sem isso, cliques em toasts re-lançam o .exe.
        ToastNotificationManagerCompat.OnActivated += OnToastActivated;

        // Se o processo foi iniciado por clique em toast (app estava fechado),
        // não faz sentido abrir a UI — o toast era de uma sessão anterior.
        if (ToastNotificationManagerCompat.WasCurrentProcessToastActivated())
        {
            Shutdown(0);
            return;
        }

        // ── Serviço da API (modo empacotado) ─────────────────────────────
        if (WebApiHostService.IsPackaged)
            _webApiHost = new WebApiHostService();

        // ── Janela principal ─────────────────────────────────────────────
        // Criamos manualmente (sem StartupUri) para controlar ordem de init
        var mainWindow = new MainWindow();
        MainWindow = mainWindow;
        mainWindow.Show();
    }

    /// <summary>
    /// Chamado pelo MainWindow depois que a API está disponível.
    /// Inicia o polling de lembretes somente quando faz sentido.
    /// </summary>
    internal void StartNotificationService()
    {
        _notificationService ??= new ReminderNotificationService();
    }

    /// <summary>
    /// Chamado quando o usuário clica em uma notificação toast.
    /// Traz a janela existente ao foco em vez de abrir nova instância.
    /// </summary>
    private void OnToastActivated(ToastNotificationActivatedEventArgsCompat e)
    {
        Dispatcher.Invoke(() =>
        {
            if (MainWindow is { } w)
            {
                if (w.WindowState == WindowState.Minimized)
                    w.WindowState = WindowState.Normal;

                w.Activate();
                w.Focus();
            }
        });
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
        // 1. Para o serviço de lembretes (timer + HttpClient)
        _notificationService?.Dispose();

        // 2. Encerra o processo da WebAPI
        _webApiHost?.Dispose();

        // 3. Limpa toasts do Action Center para evitar cliques fantasma
        //    que re-lançariam o app após o fechamento
        try { ToastNotificationManagerCompat.History.Clear(); }
        catch { /* ignore */ }

        // 4. Libera o mutex de instância única
        try { _mutex?.ReleaseMutex(); }
        catch { /* ignore */ }
        _mutex?.Dispose();

        base.OnExit(e);
    }
}

