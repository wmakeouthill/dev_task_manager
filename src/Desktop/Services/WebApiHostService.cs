using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Text;

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

    private static void LogApiFailure(string message, string? detail = null)
    {
        try
        {
            var logDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "DevTaskManager", "logs");
            Directory.CreateDirectory(logDir);
            var logPath = Path.Combine(logDir, "api-startup.log");
            var text = $"[{DateTime.Now:O}] {message}\r\n{(detail != null ? detail + "\r\n" : "")}\r\n";
            File.AppendAllText(logPath, text);
        }
        catch { /* ignore */ }
    }

    /// <summary>
    /// Retorna true se o app está em modo "publicado" (WebApi na mesma pasta).
    /// </summary>
    public static bool IsPackaged
    {
        get
        {
            var baseDir = GetAppBaseDirectory();
            return File.Exists(Path.Combine(baseDir, "DevTaskManager.WebApi.exe"))
                || File.Exists(Path.Combine(baseDir, "DevTaskManager.WebApi"));
        }
    }

    /// <summary>
    /// Diretório base do app (pasta do exe). Com single-file, AppContext.BaseDirectory
    /// aponta para a pasta de extração (temp), não para Program Files. Por isso usamos
    /// ProcessPath como fonte primária - retorna a pasta real do executável.
    /// </summary>
    private static string GetAppBaseDirectory()
    {
        var exePath = Environment.ProcessPath;
        if (!string.IsNullOrEmpty(exePath))
        {
            var exeDir = Path.GetDirectoryName(exePath);
            if (!string.IsNullOrEmpty(exeDir))
                return exeDir;
        }
        return AppContext.BaseDirectory ?? ".";
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
        {
            LogApiFailure("IsPackaged=false", $"BaseDir={GetAppBaseDirectory()}");
            return false;
        }

        var baseDir = GetAppBaseDirectory();
        var exePath = Path.Combine(baseDir, "DevTaskManager.WebApi.exe");
        if (!File.Exists(exePath))
            exePath = Path.Combine(baseDir, "DevTaskManager.WebApi");
        if (!File.Exists(exePath))
        {
            LogApiFailure("WebApi.exe não encontrado", $"BaseDir={baseDir}");
            return false;
        }

        var startInfo = new ProcessStartInfo
        {
            FileName = exePath,
            WorkingDirectory = baseDir,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardError = true,
            RedirectStandardOutput = true,
        };

        // Garante que a API usa Production e porta fixa
        startInfo.Environment["ASPNETCORE_ENVIRONMENT"] = "Production";
        startInfo.Environment["ASPNETCORE_URLS"] = "http://localhost:5011";

        try
        {
            _webApiProcess = Process.Start(startInfo);
        }
        catch (Exception ex)
        {
            LogApiFailure("Process.Start falhou", ex.ToString());
            return false;
        }

        if (_webApiProcess == null)
        {
            LogApiFailure("Process.Start retornou null");
            return false;
        }

        var stderr = new StringBuilder();
        var stdout = new StringBuilder();
        _webApiProcess.ErrorDataReceived += (_, e) => { if (e.Data != null) stderr.AppendLine(e.Data); };
        _webApiProcess.OutputDataReceived += (_, e) => { if (e.Data != null) stdout.AppendLine(e.Data); };
        _webApiProcess.BeginErrorReadLine();
        _webApiProcess.BeginOutputReadLine();

        var deadline = DateTime.UtcNow.AddSeconds(StartupTimeoutSeconds);
        while (DateTime.UtcNow < deadline)
        {
            if (_webApiProcess.HasExited)
            {
                var err = stderr.ToString();
                var outStr = stdout.ToString();
                LogApiFailure($"WebApi encerrou (exit={_webApiProcess.ExitCode})",
                    $"stderr:\n{err}\nstdout:\n{outStr}");
                return false;
            }
            if (await IsApiRunningAsync())
                return true;
            await Task.Delay(PollIntervalMs);
        }

        var err2 = stderr.ToString();
        var out2 = stdout.ToString();
        LogApiFailure("Timeout aguardando /health", $"stderr:\n{err2}\nstdout:\n{out2}");
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
