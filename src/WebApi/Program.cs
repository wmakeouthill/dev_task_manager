using Serilog;
using DevTaskManager.Application.Validators;
using DevTaskManager.Infrastructure.Data;
using DevTaskManager.Infrastructure.Repositories;
using DevTaskManager.Infrastructure.Ai;
using DevTaskManager.Domain.Interfaces;
using DevTaskManager.Application.Services;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using DevTaskManager.WebApi.Endpoints;
using DevTaskManager.WebApi.Middleware;
using DotNetEnv;

// Em modo publicado/single-file: content root deve ser a pasta do exe (onde estão wwwroot, appsettings)
// Single-file extrai para temp - usamos o diretório do executável para encontrar wwwroot
var exeDir = Path.GetDirectoryName(Environment.ProcessPath);
var contentRoot = !string.IsNullOrEmpty(exeDir) && Directory.Exists(Path.Combine(exeDir, "wwwroot"))
    ? exeDir
    : Directory.GetCurrentDirectory();

// Carrega .env do backend (src/WebApi ou raiz do repo)
var envPaths = new[]
{
    Path.Combine(contentRoot, ".env"),
    Path.Combine(Directory.GetCurrentDirectory(), ".env"),
    Path.Combine(Directory.GetCurrentDirectory(), "src", "WebApi", ".env")
};
foreach (var p in envPaths)
{
    if (File.Exists(p))
    {
        Env.Load(p);
        break;
    }
}

var builder = WebApplication.CreateBuilder(new WebApplicationOptions { ContentRootPath = contentRoot });

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

// Em Production: sempre usa AppData (instalado em Program Files não tem permissão de escrita)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (builder.Environment.IsProduction())
{
    var appData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
    var dbDir = Path.Combine(appData, "DevTaskManager");
    Directory.CreateDirectory(dbDir);
    connectionString = $"Data Source={Path.Combine(dbDir, "devtaskmanager.db")}";
}
else if (string.IsNullOrEmpty(connectionString))
{
    connectionString = "Data Source=devtaskmanager.db";
}
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlite(connectionString);
    options.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
});

builder.Services.AddScoped<IWorkspaceRepository, WorkspaceRepository>();
builder.Services.AddScoped<IBoardRepository, BoardRepository>();
builder.Services.AddScoped<ICardRepository, CardRepository>();
builder.Services.AddScoped<ICommentRepository, CommentRepository>();
builder.Services.AddScoped<IChecklistItemRepository, ChecklistItemRepository>();
builder.Services.AddScoped<IReminderRepository, ReminderRepository>();
builder.Services.AddScoped<IInsightRepository, InsightRepository>();
builder.Services.AddScoped<IStickyNoteRepository, StickyNoteRepository>();
var geminiApiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY")
    ?? builder.Configuration["Gemini:ApiKey"];
builder.Services.AddScoped<IAiProvider>(_ => new DevTaskManager.Infrastructure.Ai.GeminiAiProvider(geminiApiKey));
builder.Services.AddSingleton<DevTaskManager.Infrastructure.Ai.AiProviderFactory>();

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
builder.Services.AddScoped<CompleteReminderService>();
builder.Services.AddScoped<UpdateReminderService>();
builder.Services.AddScoped<DeleteReminderService>();
builder.Services.AddScoped<AiActionService>();
builder.Services.AddScoped<AiChatService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<ListInsightsService>();
builder.Services.AddScoped<SaveInsightsService>();
builder.Services.AddScoped<DeleteInsightService>();
builder.Services.AddScoped<DeleteAllInsightsService>();
builder.Services.AddScoped<ListPendingRemindersService>();
builder.Services.AddScoped<StickyNoteService>();
builder.Services.AddScoped<AiNoteAssistService>();
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
else
{
    // Produção/portátil: servir SPA estático do wwwroot
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

// Em produção local (portátil) não usar HTTPS para evitar problemas de certificado
if (app.Environment.IsDevelopment())
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
api.MapInsightEndpoints();
api.MapStickyNoteEndpoints();

// SPA fallback: rotas do frontend (ex: /boards/123) retornam index.html
if (!app.Environment.IsDevelopment())
{
    app.MapFallbackToFile("index.html");
}

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    // Garante que todas as tabelas existam (útil quando a migração já estava no histórico mas o banco era antigo).
    await EnsureAllTablesAsync(db);

    // Aplica alterações incrementais de schema (novas colunas em tabelas existentes).
    await ApplySchemaUpgradesAsync(db);
}

app.Run();

static async Task EnsureAllTablesAsync(AppDbContext db)
{
    var statements = new[]
    {
        "CREATE TABLE IF NOT EXISTS workspaces (Id TEXT NOT NULL PRIMARY KEY, Nome TEXT NOT NULL, OwnerId TEXT NOT NULL, CreatedAt TEXT NOT NULL)",
        "CREATE INDEX IF NOT EXISTS IX_workspaces_OwnerId ON workspaces(OwnerId)",
        "CREATE TABLE IF NOT EXISTS boards (Id TEXT NOT NULL PRIMARY KEY, WorkspaceId TEXT NOT NULL, Nome TEXT NOT NULL, CreatedAt TEXT NOT NULL)",
        "CREATE INDEX IF NOT EXISTS IX_boards_WorkspaceId ON boards(WorkspaceId)",
        "CREATE TABLE IF NOT EXISTS columns (Id TEXT NOT NULL PRIMARY KEY, BoardId TEXT NOT NULL, Nome TEXT NOT NULL, Ordem INTEGER NOT NULL, WipLimit INTEGER NULL)",
        "CREATE INDEX IF NOT EXISTS IX_columns_BoardId ON columns(BoardId)",
        "CREATE TABLE IF NOT EXISTS cards (Id TEXT NOT NULL PRIMARY KEY, BoardId TEXT NOT NULL, ColumnId TEXT NOT NULL, Titulo TEXT NOT NULL, Descricao TEXT NULL, Status TEXT NOT NULL, Ordem INTEGER NOT NULL, DueDate TEXT NULL, CreatedAt TEXT NOT NULL)",
        "CREATE INDEX IF NOT EXISTS IX_cards_BoardId ON cards(BoardId)",
        "CREATE INDEX IF NOT EXISTS IX_cards_ColumnId ON cards(ColumnId)",
        "CREATE TABLE IF NOT EXISTS comments (Id TEXT NOT NULL PRIMARY KEY, CardId TEXT NOT NULL, Autor TEXT NOT NULL, Texto TEXT NOT NULL, CreatedAt TEXT NOT NULL)",
        "CREATE INDEX IF NOT EXISTS IX_comments_CardId ON comments(CardId)",
        "CREATE TABLE IF NOT EXISTS checklist_items (Id TEXT NOT NULL PRIMARY KEY, CardId TEXT NOT NULL, Texto TEXT NOT NULL, Concluido INTEGER NOT NULL, Ordem INTEGER NOT NULL, CreatedAt TEXT NOT NULL)",
        "CREATE INDEX IF NOT EXISTS IX_checklist_items_CardId ON checklist_items(CardId)",
        "CREATE TABLE IF NOT EXISTS reminders (Id TEXT NOT NULL PRIMARY KEY, CardId TEXT NULL, Titulo TEXT NOT NULL, Descricao TEXT NULL, ScheduleAt TEXT NOT NULL, Status TEXT NOT NULL, Recurrence TEXT NOT NULL, RecurrenceDays INTEGER NULL, SnoozeUntil TEXT NULL, CreatedAt TEXT NOT NULL)",
        "CREATE INDEX IF NOT EXISTS IX_reminders_CardId ON reminders(CardId)",
        "CREATE INDEX IF NOT EXISTS IX_reminders_Status_ScheduleAt ON reminders(Status, ScheduleAt)",
        "CREATE TABLE IF NOT EXISTS insights (Id TEXT NOT NULL PRIMARY KEY, CardId TEXT NOT NULL, CardTitle TEXT NOT NULL, Status TEXT NOT NULL, Content TEXT NOT NULL, Provider TEXT NOT NULL, Action TEXT NOT NULL, DurationMs REAL NOT NULL, CreatedAt TEXT NOT NULL)",
        "CREATE INDEX IF NOT EXISTS IX_insights_CardId ON insights(CardId)",
        "CREATE TABLE IF NOT EXISTS sticky_notes (Id TEXT NOT NULL PRIMARY KEY, BoardId TEXT NULL, Title TEXT NOT NULL DEFAULT '', Content TEXT NOT NULL DEFAULT '', Color TEXT NOT NULL DEFAULT 'yellow', PositionX REAL NOT NULL DEFAULT 0, PositionY REAL NOT NULL DEFAULT 0, Width REAL NOT NULL DEFAULT 280, Height REAL NOT NULL DEFAULT 220, ZIndex INTEGER NOT NULL DEFAULT 0, CreatedAt TEXT NOT NULL, UpdatedAt TEXT NOT NULL)"
    };
    foreach (var sql in statements)
        await db.Database.ExecuteSqlRawAsync(sql);
}

/// <summary>
/// Aplica ALTER TABLE ADD COLUMN para colunas que podem não existir em bancos de versões anteriores.
/// SQLite ignora ADD COLUMN se a coluna já existe (via try/catch), garantindo upgrade seguro.
/// Adicione novos upgrades ao final da lista — eles são executados em ordem.
/// </summary>
static async Task ApplySchemaUpgradesAsync(AppDbContext db)
{
    // Cada entrada: (tabela, coluna, tipo SQL, valor default opcional)
    var columnUpgrades = new (string table, string column, string sqlType, string? defaultValue)[]
    {
        // v1.1 — BoardId para vincular notas a projetos
        ("sticky_notes", "BoardId", "TEXT NULL", null),
    };

    foreach (var (table, column, sqlType, defaultValue) in columnUpgrades)
    {
        try
        {
            var defaultClause = defaultValue is not null ? " DEFAULT " + defaultValue : "";
            var sql = "ALTER TABLE " + table + " ADD COLUMN " + column + " " + sqlType + defaultClause;
            await db.Database.ExecuteSqlRawAsync(sql);
        }
        catch (Microsoft.Data.Sqlite.SqliteException ex) when (ex.SqliteErrorCode == 1)
        {
            // "duplicate column name" — coluna já existe, ignorar
        }
    }
}
