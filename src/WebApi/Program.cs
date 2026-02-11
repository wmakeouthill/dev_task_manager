using Serilog;
using DevTaskManager.Application.Validators;
using DevTaskManager.Infrastructure.Data;
using DevTaskManager.Infrastructure.Repositories;
using DevTaskManager.Infrastructure.Ai;
using DevTaskManager.Domain.Interfaces;
using DevTaskManager.Application.Services;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using DevTaskManager.WebApi.Endpoints;
using DevTaskManager.WebApi.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

builder.Host.UseSerilog((context, config) => config
    .ReadFrom.Configuration(context.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "DevTaskManager"));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Data Source=devtaskmanager.db";
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(connectionString));

builder.Services.AddScoped<IWorkspaceRepository, WorkspaceRepository>();
builder.Services.AddScoped<IBoardRepository, BoardRepository>();
builder.Services.AddScoped<ICardRepository, CardRepository>();
builder.Services.AddScoped<ICommentRepository, CommentRepository>();
builder.Services.AddScoped<IChecklistItemRepository, ChecklistItemRepository>();
builder.Services.AddScoped<IReminderRepository, ReminderRepository>();
builder.Services.AddScoped<IAiProvider, LocalAiProvider>();

builder.Services.AddValidatorsFromAssemblyContaining<CreateWorkspaceRequestValidator>();
builder.Services.AddScoped<ListWorkspacesService>();
builder.Services.AddScoped<CreateWorkspaceService>();
builder.Services.AddScoped<GetWorkspaceService>();
builder.Services.AddScoped<UpdateWorkspaceService>();
builder.Services.AddScoped<DeleteWorkspaceService>();
builder.Services.AddScoped<ListBoardsService>();
builder.Services.AddScoped<CreateBoardService>();
builder.Services.AddScoped<GetBoardService>();
builder.Services.AddScoped<UpdateBoardService>();
builder.Services.AddScoped<DeleteBoardService>();
builder.Services.AddScoped<AddColumnService>();
builder.Services.AddScoped<UpdateColumnService>();
builder.Services.AddScoped<DeleteColumnService>();
builder.Services.AddScoped<MoveColumnService>();
builder.Services.AddScoped<ListCardsService>();
builder.Services.AddScoped<CreateCardService>();
builder.Services.AddScoped<GetCardService>();
builder.Services.AddScoped<UpdateCardService>();
builder.Services.AddScoped<MoveCardService>();
builder.Services.AddScoped<UpdateCardStatusService>();
builder.Services.AddScoped<DeleteCardService>();
builder.Services.AddScoped<AddCommentService>();
builder.Services.AddScoped<ListCommentsService>();
builder.Services.AddScoped<DeleteCommentService>();
builder.Services.AddScoped<AddChecklistItemService>();
builder.Services.AddScoped<ListChecklistItemsService>();
builder.Services.AddScoped<ToggleChecklistItemService>();
builder.Services.AddScoped<DeleteChecklistItemService>();
builder.Services.AddScoped<CreateReminderService>();
builder.Services.AddScoped<ListRemindersService>();
builder.Services.AddScoped<SnoozeReminderService>();
builder.Services.AddScoped<CancelReminderService>();
builder.Services.AddScoped<AiActionService>();
builder.Services.AddScoped<DashboardService>();
#pragma warning disable CA1416
builder.Services.AddSingleton<WindowsUserService>();
#pragma warning restore CA1416

builder.Services.AddCors(options =>
{
    options.AddPolicy("LocalDev", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseCors("LocalDev");
}

app.UseHttpsRedirection();
app.MapHealthChecks("/health");

var api = app.MapGroup("/api/v1");
api.MapGet("/status", () => Results.Ok(new { status = "ok" }));
api.MapWorkspaceEndpoints();
api.MapBoardEndpoints();
api.MapColumnEndpoints();
api.MapCardEndpoints();
api.MapCommentEndpoints();
api.MapChecklistEndpoints();
api.MapReminderEndpoints();
api.MapAiEndpoints();
api.MapDashboardEndpoints();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();
}

app.Run();
