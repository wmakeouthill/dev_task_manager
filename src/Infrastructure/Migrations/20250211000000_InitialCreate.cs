using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DevTaskManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Usa IF NOT EXISTS para funcionar com banco vazio ou já existente (ex.: criado com EnsureCreated antes).
            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS workspaces (
    Id TEXT NOT NULL PRIMARY KEY,
    Nome TEXT NOT NULL,
    OwnerId TEXT NOT NULL,
    CreatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS IX_workspaces_OwnerId ON workspaces(OwnerId);

CREATE TABLE IF NOT EXISTS boards (
    Id TEXT NOT NULL PRIMARY KEY,
    WorkspaceId TEXT NOT NULL,
    Nome TEXT NOT NULL,
    CreatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS IX_boards_WorkspaceId ON boards(WorkspaceId);

CREATE TABLE IF NOT EXISTS columns (
    Id TEXT NOT NULL PRIMARY KEY,
    BoardId TEXT NOT NULL,
    Nome TEXT NOT NULL,
    Ordem INTEGER NOT NULL,
    WipLimit INTEGER NULL
);
CREATE INDEX IF NOT EXISTS IX_columns_BoardId ON columns(BoardId);

CREATE TABLE IF NOT EXISTS cards (
    Id TEXT NOT NULL PRIMARY KEY,
    BoardId TEXT NOT NULL,
    ColumnId TEXT NOT NULL,
    Titulo TEXT NOT NULL,
    Descricao TEXT NULL,
    Status TEXT NOT NULL,
    Ordem INTEGER NOT NULL,
    DueDate TEXT NULL,
    CreatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS IX_cards_BoardId ON cards(BoardId);
CREATE INDEX IF NOT EXISTS IX_cards_ColumnId ON cards(ColumnId);

CREATE TABLE IF NOT EXISTS comments (
    Id TEXT NOT NULL PRIMARY KEY,
    CardId TEXT NOT NULL,
    Autor TEXT NOT NULL,
    Texto TEXT NOT NULL,
    CreatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS IX_comments_CardId ON comments(CardId);

CREATE TABLE IF NOT EXISTS checklist_items (
    Id TEXT NOT NULL PRIMARY KEY,
    CardId TEXT NOT NULL,
    Texto TEXT NOT NULL,
    Concluido INTEGER NOT NULL,
    Ordem INTEGER NOT NULL,
    CreatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS IX_checklist_items_CardId ON checklist_items(CardId);

CREATE TABLE IF NOT EXISTS reminders (
    Id TEXT NOT NULL PRIMARY KEY,
    CardId TEXT NULL,
    Titulo TEXT NOT NULL,
    Descricao TEXT NULL,
    ScheduleAt TEXT NOT NULL,
    Status TEXT NOT NULL,
    Recurrence TEXT NOT NULL,
    RecurrenceDays INTEGER NULL,
    SnoozeUntil TEXT NULL,
    CreatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS IX_reminders_CardId ON reminders(CardId);
CREATE INDEX IF NOT EXISTS IX_reminders_Status_ScheduleAt ON reminders(Status, ScheduleAt);
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "reminders");
            migrationBuilder.DropTable(name: "checklist_items");
            migrationBuilder.DropTable(name: "comments");
            migrationBuilder.DropTable(name: "cards");
            migrationBuilder.DropTable(name: "columns");
            migrationBuilder.DropTable(name: "boards");
            migrationBuilder.DropTable(name: "workspaces");
        }
    }
}
