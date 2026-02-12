using System;
using System.IO;
using System.Windows;
using DevTaskManager.Desktop.Services;
using Microsoft.Web.WebView2.Wpf;

namespace DevTaskManager.Desktop;

/// <summary>
/// Interaction logic for MainWindow.xaml
/// </summary>
public partial class MainWindow : Window
{
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
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
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

        var url = WebApiHostService.FrontendUrl;
        if (WebApiHostService.IsPackaged && (Application.Current as App)?.WebApiHost is { } host)
        {
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

        AppWebView.Source = new Uri(url);
    }
}