using DevTaskManager.Application.DTOs;
using DevTaskManager.Application.Services;

namespace DevTaskManager.WebApi.Endpoints;

public static class DashboardEndpoints
{
    public static void MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/dashboard")
            .WithTags("Dashboard");

        group.MapGet("/", async (DashboardService service, CancellationToken ct) =>
        {
            var dashboard = await service.ExecuteAsync(ct);
            return Results.Ok(dashboard);
        })
        .WithName("GetDashboard")
        .WithSummary("Dados do dashboard com estatísticas e cards recentes")
        .Produces<DashboardDto>();

#pragma warning disable CA1416
        group.MapGet("/user", (WindowsUserService service) =>
        {
            var user = service.GetCurrentUser();
            return Results.Ok(user);
        })
#pragma warning restore CA1416
        .WithName("GetCurrentUser")
        .WithSummary("Dados do usuário Windows atual")
        .Produces<WindowsUserDto>();
    }
}
