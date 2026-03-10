using System;
using System.IO;
using System.Windows;
using DevTaskManager.Desktop.Services;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.Wpf;

namespace DevTaskManager.Desktop;

/// <summary>
/// Interaction logic for MainWindow.xaml
/// </summary>
public partial class MainWindow : Window
{
    private bool _webViewReady;
    private string? _targetUrl;

    public MainWindow()
    {
        InitializeComponent();

        // Usa pasta em AppData para evitar erro de permissão quando instalado em Program Files
        var userDataFolder = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "DevTaskManager", "WebView2");
        AppWebView.CreationProperties = new CoreWebView2CreationProperties
        {
            UserDataFolder = userDataFolder
        };

        Loaded += OnLoaded;
        Closing += OnClosing;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        // ── Inicializa WebView2 ──────────────────────────────────────────
        try
        {
            await AppWebView.EnsureCoreWebView2Async(null);
        }
        catch (Exception ex)
        {
            var msg = ex.Message.Contains("WebView2", StringComparison.OrdinalIgnoreCase) ||
                      ex.Message.Contains("Unable to create", StringComparison.OrdinalIgnoreCase) ||
                      ex.Message.Contains("runtime", StringComparison.OrdinalIgnoreCase)
                ? "O WebView2 Runtime não está instalado ou não foi encontrado.\r\n\r\n" +
                  "Baixe e instale em: https://developer.microsoft.com/microsoft-edge/webview2/"
                : ex.Message;

            MessageBox.Show(msg, "Dev Task Manager - Erro", MessageBoxButton.OK, MessageBoxImage.Error);
            Close();
            return;
        }

        _webViewReady = true;

        // Impede abertura de janelas externas (window.open, target="_blank")
        // — sem isso, o WebView2 abre novas janelas que podem mostrar "site indisponível"
        AppWebView.CoreWebView2.NewWindowRequested += OnNewWindowRequested;

        // Monitora resultado da navegação para feedback visual
        AppWebView.CoreWebView2.NavigationCompleted += OnNavigationCompleted;

        // Cor de fundo enquanto o SPA carrega (evita flash branco)
        AppWebView.CoreWebView2.Profile.PreferredColorScheme = CoreWebView2PreferredColorScheme.Dark;

        // Força about:blank para limpar qualquer estado de sessão anterior do WebView2.
        // Sem isso, o WebView2 pode tentar restaurar a última URL visitada (ex: /boards)
        // antes de a API estar pronta, resultando em "page not found".
        AppWebView.CoreWebView2.Navigate("about:blank");

        // ── Garante que a API está disponível (modo empacotado) ──────────
        _targetUrl = WebApiHostService.FrontendUrl;
        if (WebApiHostService.IsPackaged && (Application.Current as App)?.WebApiHost is { } host)
        {
            LoadingText.Text = "Iniciando servidor…";

            var ready = await host.EnsureApiRunningAsync();
            if (!ready)
            {
                var logPath = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "DevTaskManager", "logs", "api-startup.log");
                MessageBox.Show(
                    "Não foi possível iniciar a API." + (File.Exists(logPath)
                        ? $"\r\n\r\nDetalhes em: {logPath}"
                        : "\r\n\r\nVerifique se os arquivos estão completos na pasta do aplicativo."),
                    "Dev Task Manager",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error);
                Close();
                return;
            }
        }

        // ── Navega para o frontend (sempre root, nunca sub-rota) ─────────
        // Usar root garante que o React Router inicializa em estado conhecido
        // independente de qualquer URL salva pelo WebView2.
        LoadingText.Text = "Carregando interface…";
        AppWebView.CoreWebView2.Navigate(_targetUrl);

        // ── Inicia serviço de lembretes (após a API estar pronta) ────────
        (Application.Current as App)?.StartNotificationService();
    }

    /// <summary>
    /// Intercepta tentativas de abrir novas janelas (window.open / target="_blank").
    /// — /notes/popup  → abre como janela flutuante sem borda (NotePopupWindow)
    /// — links externos → abre no navegador do sistema
    /// — outros internos → navega na mesma janela
    /// </summary>
    private void OnNewWindowRequested(object? sender, CoreWebView2NewWindowRequestedEventArgs e)
    {
        e.Handled = true;

        if (!Uri.TryCreate(e.Uri, UriKind.Absolute, out var uri)) return;

        // Sticky-note popup — abre como janela WPF frameless
        if ((uri.Host is "localhost" or "127.0.0.1") &&
            uri.AbsolutePath.StartsWith("/notes/popup", StringComparison.OrdinalIgnoreCase))
        {
            var w = e.WindowFeatures.HasSize ? e.WindowFeatures.Width  : 290;
            var h = e.WindowFeatures.HasSize ? e.WindowFeatures.Height : 252;
            Dispatcher.Invoke(() =>
            {
                var popup = new NotePopupWindow(e.Uri, w, h);
                popup.Show();
            });
            return;
        }

        // Link externo — abre no navegador do sistema
        if (uri.Host != "localhost" && uri.Host != "127.0.0.1")
        {
            try
            {
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                {
                    FileName = e.Uri,
                    UseShellExecute = true
                });
            }
            catch { /* ignore */ }
            return;
        }

        // Outro link interno — navega na mesma janela
        AppWebView.CoreWebView2.Navigate(e.Uri);
    }

    /// <summary>
    /// Esconde o overlay quando o SPA carrega com sucesso.
    /// Ignora navegações intermediárias (about:blank).
    /// Faz retry automático se a navegação para a URL real falhar.
    /// </summary>
    private async void OnNavigationCompleted(object? sender, CoreWebView2NavigationCompletedEventArgs e)
    {
        // Ignora navegações intermediárias (ex: about:blank durante inicialização)
        var currentSource = AppWebView.Source?.AbsoluteUri;
        if (string.IsNullOrEmpty(currentSource) ||
            currentSource.Equals("about:blank", StringComparison.OrdinalIgnoreCase))
            return;

        if (e.IsSuccess)
        {
            LoadingOverlay.Visibility = Visibility.Collapsed;
            return;
        }

        // Navegação falhou — faz até 3 tentativas com intervalo crescente
        // antes de mostrar a mensagem de erro. Cobre casos onde a API demorou
        // mais do que o esperado para estar pronta na porta.
        if (_targetUrl is null) return;
        for (int attempt = 1; attempt <= 3; attempt++)
        {
            await Task.Delay(attempt * 1000);
            if (!_webViewReady) return;
            try
            {
                var ok = await WebApiHostService.IsApiRunningAsync();
                if (ok)
                {
                    AppWebView.CoreWebView2.Navigate(_targetUrl);
                    return;
                }
            }
            catch { /* WebView2 pode estar sendo destruído */ return; }
        }

        LoadingText.Text =
            "Não foi possível carregar a aplicação.\n" +
            "Verifique se o servidor está rodando\n" +
            "e tente reabrir o aplicativo.";
    }

    /// <summary>
    /// Limpa event handlers e libera WebView2 ao fechar.
    /// Sem isso, o WebView2 pode manter o processo vivo.
    /// </summary>
    private void OnClosing(object? sender, System.ComponentModel.CancelEventArgs e)
    {
        if (_webViewReady)
        {
            try
            {
                AppWebView.CoreWebView2.NewWindowRequested -= OnNewWindowRequested;
                AppWebView.CoreWebView2.NavigationCompleted -= OnNavigationCompleted;
            }
            catch { /* WebView2 pode já estar disposed */ }
        }

        try { AppWebView.Dispose(); }
        catch { /* ignore */ }
    }
}