namespace DevTaskManager.Application.DTOs;

public record AiActionRequest(string Action, Guid CardId);

public record AiActionResponse(string Content, string Provider, double DurationMs);

public record DashboardDto(
    int TotalCards,
    int CardsTodo,
    int CardsInProgress,
    int CardsDone,
    int CardsOverdue,
    int TotalBoards,
    int TotalWorkspaces,
    int PendingReminders,
    IReadOnlyList<CardDto> RecentCards,
    IReadOnlyList<CardDto> OverdueCards);

public record WindowsUserDto(string DisplayName, string Username, string? AvatarBase64);
