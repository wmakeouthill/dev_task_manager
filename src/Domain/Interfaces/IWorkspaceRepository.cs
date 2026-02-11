using DevTaskManager.Domain.Entities;

namespace DevTaskManager.Domain.Interfaces;

public interface IWorkspaceRepository
{
    Task<Workspace?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<(IReadOnlyList<Workspace> Items, long Total)> ListAsync(int page, int size, CancellationToken ct = default);
    Task<Workspace> SaveAsync(Workspace workspace, CancellationToken ct = default);
    Task UpdateAsync(Workspace workspace, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
