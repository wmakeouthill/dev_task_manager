using System.Diagnostics;
using System.IO;
using System.Net.Http;

namespace DevTaskManager.Desktop.Services;

/// <summary>
/// Gerencia o ciclo de vida do processo WebApi em modo portátil/publicado.
/// Inicia o WebApi se não estiver rodando e encerra ao sair.
/// </summary>
public sealed class WebApiHostService : IDisposable
{
    private const string BaseUrl = "http://localhost:5011";
    private const string HealthUrl = BaseUrl + "/health";
    private const int StartupTimeoutSeconds = 30;
    private const int PollIntervalMs = 500;

    private Process? _webApiProcess;
    private bool _disposed;
    private static readonly HttpClient HttpClient = new() { Timeout = TimeSpan.FromSeconds(3) };

    /// <summary>
    /// Retorna true se o app está em modo "publicado" (WebApi na mesma pasta).
    /// </summary>
    public static bool IsPackaged
    {
        get
        {
            var baseDir = AppContext.BaseDirectory;
            return File.Exists(Path.Combine(baseDir, "DevTaskManager.WebApi.exe"))
                || File.Exists(Path.Combine(baseDir, "DevTaskManager.WebApi"));
        }
    }

    /// <summary>
    /// URL do frontend: em dev (Vite) ou em prod (WebApi servindo SPA).
    /// </summary>
    public static string FrontendUrl => IsPackaged ? BaseUrl : "http://localhost:5173";

    /// <summary>
    /// Garante que a API está rodando. Se em modo publicado, inicia o processo WebApi.
    /// Retorna true se a API está pronta.
    /// </summary>
    public async Task<bool> EnsureApiRunningAsync()
    {
        if (await IsApiRunningAsync())
            return true;

        if (!IsPackaged)
            return false;

        var exePath = Path.Combine(AppContext.BaseDirectory, "DevTaskManager.WebApi.exe");
        if (!File.Exists(exePath))
            exePath = Path.Combine(AppContext.BaseDirectory, "DevTaskManager.WebApi");
        if (!File.Exists(exePath))
            return false;

        var startInfo = new ProcessStartInfo
        {
            FileName = exePath,
            WorkingDirectory = AppContext.BaseDirectory,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        // Garante que a API usa Production e porta fixa
        startInfo.Environment["ASPNETCORE_ENVIRONMENT"] = "Production";
        startInfo.Environment["ASPNETCORE_URLS"] = "http://localhost:5011";

        try
        {
            _webApiProcess = Process.Start(startInfo);
        }
        catch (Exception)
        {
            return false;
        }

        if (_webApiProcess == null)
            return false;

        var deadline = DateTime.UtcNow.AddSeconds(StartupTimeoutSeconds);
        while (DateTime.UtcNow < deadline)
        {
            if (await IsApiRunningAsync())
                return true;
            await Task.Delay(PollIntervalMs);
        }

        return false;
    }

    public static async Task<bool> IsApiRunningAsync()
    {
        try
        {
            var response = await HttpClient.GetAsync(HealthUrl);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public void Dispose()
    {
        if (_disposed)
            return;

        try
        {
            if (_webApiProcess is { HasExited: false })
            {
                _webApiProcess.Kill(entireProcessTree: true);
            }
        }
        catch
        {
            // Ignorar erros ao encerrar
        }
        finally
        {
            _webApiProcess?.Dispose();
            _disposed = true;
        }
    }
}
