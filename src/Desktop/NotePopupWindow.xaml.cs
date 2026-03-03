using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Windows;
using System.Windows.Interop;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.Wpf;

namespace DevTaskManager.Desktop;

/// <summary>
/// Frameless sticky-note popup window backed by a WebView2 instance.
/// JS communicates via window.chrome.webview.postMessage() for drag and close.
/// </summary>
public partial class NotePopupWindow : Window
{
    [DllImport("user32.dll")]
    private static extern bool ReleaseCapture();

    [DllImport("user32.dll")]
    private static extern IntPtr SendMessage(IntPtr hWnd, int msg, IntPtr wParam, IntPtr lParam);

    private const int WM_NCLBUTTONDOWN = 0xA1;
    private const int HTCAPTION        = 2;

    private readonly string _url;

    public NotePopupWindow(string url, double width = 290, double height = 252)
    {
        InitializeComponent();

        _url   = url;
        Width  = width;
        Height = height;

        // Share the same user data folder as the main window so cookies/session are shared.
        var userDataFolder = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "DevTaskManager", "WebView2");

        PopupWebView.CreationProperties = new CoreWebView2CreationProperties
        {
            UserDataFolder = userDataFolder
        };

        Loaded += OnLoaded;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        await PopupWebView.EnsureCoreWebView2Async(null);

        PopupWebView.CoreWebView2.Profile.PreferredColorScheme = CoreWebView2PreferredColorScheme.Dark;

        // Block any nested window.open() inside the popup.
        PopupWebView.CoreWebView2.NewWindowRequested += (_, ev) => ev.Handled = true;

        // Handle drag-start and close messages from JS.
        PopupWebView.CoreWebView2.WebMessageReceived += OnWebMessageReceived;

        PopupWebView.Source = new Uri(_url);
    }

    private void OnWebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        string message;
        try   { message = JsonSerializer.Deserialize<string>(e.WebMessageAsJson) ?? ""; }
        catch { return; }

        switch (message)
        {
            case "drag-start":
                // Simulate WM_NCLBUTTONDOWN on the caption area to start native window drag.
                Dispatcher.Invoke(() =>
                {
                    try
                    {
                        ReleaseCapture();
                        SendMessage(
                            new WindowInteropHelper(this).Handle,
                            WM_NCLBUTTONDOWN,
                            new IntPtr(HTCAPTION),
                            IntPtr.Zero);
                    }
                    catch { /* ignore */ }
                });
                break;

            case "close":
                Dispatcher.Invoke(() => Close());
                break;
        }
    }
}
