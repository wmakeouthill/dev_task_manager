using System;
using System.Windows;

namespace DevTaskManager.Desktop;

/// <summary>
/// Interaction logic for MainWindow.xaml
/// </summary>
public partial class MainWindow : Window
{
    private const string FrontendUrl = "http://localhost:5173";

    public MainWindow()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        await AppWebView.EnsureCoreWebView2Async();
        AppWebView.Source = new Uri(FrontendUrl);
    }
}