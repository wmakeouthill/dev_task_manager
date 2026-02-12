using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;
using System.Text;

namespace DevTaskManager.Desktop.Services;

/// <summary>
/// Registra o DevTaskManager no Windows para que apareça em
/// Configurações → Sistema → Notificações com nome e ícone próprios.
/// Cria um atalho no Menu Iniciar com o AppUserModelID correto.
/// Funciona no Windows 10 e 11 para apps Win32 (não-MSIX).
/// </summary>
public static class ToastRegistrationService
{
    /// <summary>
    /// AUMID usado pelo Microsoft.Toolkit.Uwp.Notifications para identificar o app.
    /// </summary>
    public const string AppId = "DevTaskManager.Desktop";

    /// <summary>
    /// Registra o atalho no Menu Iniciar (se necessário) e configura o AUMID.
    /// Deve ser chamado antes de qualquer ToastNotification.
    /// </summary>
    public static void Register()
    {
        // Associa o AUMID ao processo atual — necessário para que o Windows
        // vincule as notificações a este app e não ao host genérico
        SetCurrentProcessExplicitAppUserModelID(AppId);

        var shortcutPath = GetShortcutPath();

        if (!File.Exists(shortcutPath))
        {
            CreateShortcut(shortcutPath);
        }
        else
        {
            // Garante que o AUMID está correto mesmo em atalhos existentes
            UpdateShortcutAppId(shortcutPath);
        }
    }

    [DllImport("shell32.dll", SetLastError = true)]
    private static extern int SetCurrentProcessExplicitAppUserModelID(
        [MarshalAs(UnmanagedType.LPWStr)] string appId);

    private static string GetShortcutPath()
    {
        var startMenu = Environment.GetFolderPath(Environment.SpecialFolder.StartMenu);
        var programsDir = Path.Combine(startMenu, "Programs");
        Directory.CreateDirectory(programsDir);
        return Path.Combine(programsDir, "Dev Task Manager.lnk");
    }

    private static void CreateShortcut(string shortcutPath)
    {
        var exePath = Environment.ProcessPath ?? AppContext.BaseDirectory + "DevTaskManager.Desktop.exe";
        var workDir = Path.GetDirectoryName(exePath) ?? AppContext.BaseDirectory;
        var iconPath = FindIconPath(workDir);

        var shellLink = (IShellLinkW)new ShellLink();
        shellLink.SetPath(exePath);
        shellLink.SetWorkingDirectory(workDir);
        shellLink.SetDescription("Dev Task Manager — Gerenciador de tarefas de desenvolvimento");

        if (iconPath is not null)
            shellLink.SetIconLocation(iconPath, 0);

        // Define o AppUserModelID no atalho
        var propertyStore = (IPropertyStore)shellLink;
        var appIdKey = new PropertyKey(new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"), 5);
        var propVariant = new PropVariant(AppId);
        propertyStore.SetValue(ref appIdKey, ref propVariant);
        propertyStore.Commit();

        var persistFile = (IPersistFile)shellLink;
        persistFile.Save(shortcutPath, true);
    }

    private static void UpdateShortcutAppId(string shortcutPath)
    {
        try
        {
            var shellLink = (IShellLinkW)new ShellLink();
            var persistFile = (IPersistFile)shellLink;
            persistFile.Load(shortcutPath, 0);

            var propertyStore = (IPropertyStore)shellLink;
            var appIdKey = new PropertyKey(new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"), 5);
            var propVariant = new PropVariant(AppId);
            propertyStore.SetValue(ref appIdKey, ref propVariant);
            propertyStore.Commit();

            persistFile.Save(shortcutPath, true);
        }
        catch
        {
            // Se falhar ao atualizar, não impede o app de rodar
        }
    }

    private static string? FindIconPath(string workDir)
    {
        // Tenta encontrar o ícone na pasta icon/ relativa ao exe
        var candidates = new[]
        {
            Path.Combine(workDir, "icon.ico"),
            Path.Combine(workDir, "..", "..", "icon", "icon.ico"),
            Path.Combine(AppContext.BaseDirectory, "icon.ico"),
        };

        foreach (var path in candidates)
        {
            if (File.Exists(path))
                return Path.GetFullPath(path);
        }

        return null;
    }

    // ── COM Interop para criação de atalhos (.lnk) ──

    [ComImport]
    [Guid("00021401-0000-0000-C000-000000000046")]
    private class ShellLink { }

    [ComImport]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    [Guid("000214F9-0000-0000-C000-000000000046")]
    private interface IShellLinkW
    {
        void GetPath([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszFile, int cch, IntPtr pfd, int fFlags);
        void GetIDList(out IntPtr ppidl);
        void SetIDList(IntPtr pidl);
        void GetDescription([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszName, int cch);
        void SetDescription([MarshalAs(UnmanagedType.LPWStr)] string pszName);
        void GetWorkingDirectory([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszDir, int cch);
        void SetWorkingDirectory([MarshalAs(UnmanagedType.LPWStr)] string pszDir);
        void GetArguments([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszArgs, int cch);
        void SetArguments([MarshalAs(UnmanagedType.LPWStr)] string pszArgs);
        void GetHotkey(out short pwHotkey);
        void SetHotkey(short wHotkey);
        void GetShowCmd(out int piShowCmd);
        void SetShowCmd(int iShowCmd);
        void GetIconLocation([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszIconPath, int cch, out int piIcon);
        void SetIconLocation([MarshalAs(UnmanagedType.LPWStr)] string pszIconPath, int iIcon);
        void SetRelativePath([MarshalAs(UnmanagedType.LPWStr)] string pszPathRel, int dwReserved);
        void Resolve(IntPtr hwnd, int fFlags);
        void SetPath([MarshalAs(UnmanagedType.LPWStr)] string pszFile);
    }

    [ComImport]
    [Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface IPropertyStore
    {
        void GetCount(out uint cProps);
        void GetAt(uint iProp, out PropertyKey pkey);
        void GetValue(ref PropertyKey key, out PropVariant pv);
        void SetValue(ref PropertyKey key, ref PropVariant pv);
        void Commit();
    }

    [StructLayout(LayoutKind.Sequential, Pack = 4)]
    private struct PropertyKey
    {
        public Guid fmtid;
        public uint pid;

        public PropertyKey(Guid fmtid, uint pid)
        {
            this.fmtid = fmtid;
            this.pid = pid;
        }
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct PropVariant
    {
        public ushort vt;
        public ushort wReserved1;
        public ushort wReserved2;
        public ushort wReserved3;
        public IntPtr pwszVal;

        public PropVariant(string value)
        {
            vt = 31; // VT_LPWSTR
            wReserved1 = 0;
            wReserved2 = 0;
            wReserved3 = 0;
            pwszVal = Marshal.StringToCoTaskMemUni(value);
        }
    }
}
