namespace DevTaskManager.Application.DTOs;

public sealed record PagedResponse<T>(
    IReadOnlyList<T> Content,
    int Page,
    int Size,
    long TotalElements,
    int TotalPages,
    bool IsLast);
