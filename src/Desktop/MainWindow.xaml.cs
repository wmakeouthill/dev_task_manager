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

        // ── Garante que a API está disponível (modo empacotado) ──────────
        var url = WebApiHostService.FrontendUrl;
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

        // ── Navega para o frontend ───────────────────────────────────────
        LoadingText.Text = "Carregando interface…";
        AppWebView.Source = new Uri(url);

        // ── Inicia serviço de lembretes (após a API estar pronta) ────────
        (Application.Current as App)?.StartNotificationService();
    }

    /// <summary>
    /// Intercepta tentativas de abrir novas janelas — navega na mesma aba.
    /// Evita janelas fantasma com "site indisponível".
    /// </summary>
    private void OnNewWindowRequested(object? sender, CoreWebView2NewWindowRequestedEventArgs e)
    {
        e.Handled = true;

        // Se é um link externo (não localhost), abre no navegador do sistema
        if (Uri.TryCreate(e.Uri, UriKind.Absolute, out var uri)
            && uri.Host != "localhost"
            && uri.Host != "127.0.0.1")
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
        }
        else
        {
            // Link interno — navega na mesma janela
            AppWebView.CoreWebView2.Navigate(e.Uri);
        }
    }

    /// <summary>
    /// Esconde o overlay de carregamento quando o SPA termina de carregar.
    /// Mostra erro amigável se a navegação falhou.
    /// </summary>
    private void OnNavigationCompleted(object? sender, CoreWebView2NavigationCompletedEventArgs e)
    {
        if (e.IsSuccess)
        {
            LoadingOverlay.Visibility = Visibility.Collapsed;
        }
        else
        {
            LoadingText.Text =
                "Não foi possível carregar a aplicação.\n" +
                "Verifique se o servidor está rodando\n" +
                "e tente reabrir o aplicativo.";
        }
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