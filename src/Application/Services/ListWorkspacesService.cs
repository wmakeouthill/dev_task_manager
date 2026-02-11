using DevTaskManager.Application.DTOs;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Application.Services;

public class ListWorkspacesService(IWorkspaceRepository repository)
{
    public async Task<PagedResponse<WorkspaceDto>> ExecuteAsync(int page, int size, CancellationToken ct = default)
    {
        var (items, total) = await repository.ListAsync(page, size, ct);
        var totalPages = size > 0 ? (int)Math.Ceiling(total / (double)size) : 0;
        return new PagedResponse<WorkspaceDto>(
            items.Select(WorkspaceDto.From).ToList(),
            page,
            size,
            total,
            totalPages,
            page >= totalPages || items.Count < size);
    }
}
