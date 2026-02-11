using System.Runtime.Versioning;
using System.Security.Principal;
using DevTaskManager.Application.DTOs;

namespace DevTaskManager.Application.Services;

[SupportedOSPlatform("windows")]
public class WindowsUserService
{
    public WindowsUserDto GetCurrentUser()
    {
        var identity = WindowsIdentity.GetCurrent();
        var displayName = identity.Name;

        // Extract just the username part (DOMAIN\username -> username)
        var username = displayName.Contains('\\')
            ? displayName.Split('\\').Last()
            : displayName;

        // Try to get user-friendly display name
        var friendlyName = username;
        try
        {
            var principal = new System.DirectoryServices.AccountManagement.PrincipalContext(
                System.DirectoryServices.AccountManagement.ContextType.Machine);
            var user = System.DirectoryServices.AccountManagement.UserPrincipal.FindByIdentity(principal, identity.Name);
            if (user?.DisplayName is not null)
                friendlyName = user.DisplayName;
        }
        catch
        {
            // Fallback to identity name if directory services unavailable
        }

        // Try to read Windows account picture
        string? avatarBase64 = null;
        try
        {
            var accountPicDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "Microsoft", "Windows", "AccountPictures");

            if (Directory.Exists(accountPicDir))
            {
                var pic = Directory.GetFiles(accountPicDir, "*.dat")
                    .Concat(Directory.GetFiles(accountPicDir, "*.png"))
                    .Concat(Directory.GetFiles(accountPicDir, "*.jpg"))
                    .OrderByDescending(f => new FileInfo(f).Length)
                    .FirstOrDefault();

                if (pic is not null)
                {
                    var bytes = File.ReadAllBytes(pic);
                    avatarBase64 = Convert.ToBase64String(bytes);
                }
            }

            // Alternative location
            if (avatarBase64 is null)
            {
                var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                var tileDir = Path.Combine(localAppData, "Temp");
                var accountImg = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                    "Microsoft", "Windows", "AccountPictures");

                // Try public account pictures
                var publicPicDir = @"C:\Users\Public\AccountPictures";
                if (Directory.Exists(publicPicDir))
                {
                    var userSidDir = Directory.GetDirectories(publicPicDir).FirstOrDefault();
                    if (userSidDir is not null)
                    {
                        var pic = Directory.GetFiles(userSidDir, "*.png")
                            .Concat(Directory.GetFiles(userSidDir, "*.jpg"))
                            .OrderByDescending(f => new FileInfo(f).Length)
                            .FirstOrDefault();
                        if (pic is not null)
                            avatarBase64 = Convert.ToBase64String(File.ReadAllBytes(pic));
                    }
                }
            }
        }
        catch
        {
            // Avatar is optional, silently fail
        }

        return new WindowsUserDto(friendlyName, username, avatarBase64);
    }
}
