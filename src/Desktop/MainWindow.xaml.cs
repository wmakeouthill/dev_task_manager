using System;
using System.Windows;
using DevTaskManager.Desktop.Services;

namespace DevTaskManager.Desktop;

/// <summary>
/// Interaction logic for MainWindow.xaml
/// </summary>
public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        await AppWebView.EnsureCoreWebView2Async();

        var url = WebApiHostService.FrontendUrl;
        if (WebApiHostService.IsPackaged && (Application.Current as App)?.WebApiHost is { } host)
        {
            var ready = await host.EnsureApiRunningAsync();
            if (!ready)
            {
                MessageBox.Show(
                    "Não foi possível iniciar a API. Verifique se os arquivos estão completos na pasta do aplicativo.",
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