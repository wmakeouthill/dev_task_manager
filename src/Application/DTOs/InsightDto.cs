namespace DevTaskManager.Application.DTOs;

public record InsightDto(
    Guid Id,
    Guid CardId,
    string CardTitle,
    string Status,
    string Content,
    string Provider,
    string Action,
    double DurationMs,
    DateTime CreatedAt);

public record SaveInsightsRequest(
    string Action,
    IReadOnlyList<SaveInsightItem> Insights,
    double TotalDurationMs);

public record SaveInsightItem(
    Guid CardId,
    string CardTitle,
    string Status,
    string Content,
    string Provider,
    double DurationMs);
