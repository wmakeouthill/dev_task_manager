using DevTaskManager.Application.DTOs;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Application.Services;

public class ListBoardsService(IBoardRepository repository)
{
    public async Task<PagedResponse<BoardDto>> ExecuteAsync(Guid workspaceId, int page, int size, CancellationToken ct = default)
    {
        var (items, total) = await repository.ListByWorkspaceAsync(workspaceId, page, size, ct);
        var totalPages = size > 0 ? (int)Math.Ceiling(total / (double)size) : 0;
        return new PagedResponse<BoardDto>(
            items.Select(BoardDto.From).ToList(),
            page,
            size,
            total,
            totalPages,
            page >= totalPages || items.Count < size);
    }
}
