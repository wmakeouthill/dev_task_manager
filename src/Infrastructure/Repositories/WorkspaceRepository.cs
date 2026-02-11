using DevTaskManager.Domain.Entities;
using DevTaskManager.Domain.Interfaces;
using DevTaskManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DevTaskManager.Infrastructure.Repositories;

public class WorkspaceRepository(AppDbContext context) : IWorkspaceRepository
{
    public async Task<Workspace?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await context.Workspaces.FirstOrDefaultAsync(w => w.Id == id, ct);

    public async Task<(IReadOnlyList<Workspace> Items, long Total)> ListAsync(int page, int size, CancellationToken ct = default)
    {
        var query = context.Workspaces.OrderBy(w => w.CreatedAt);
        var total = await query.LongCountAsync(ct);
        var items = await query
            .Skip((page - 1) * size)
            .Take(size)
            .ToListAsync(ct);
        return (items, total);
    }

    public async Task<Workspace> SaveAsync(Workspace workspace, CancellationToken ct = default)
    {
        context.Workspaces.Add(workspace);
        await context.SaveChangesAsync(ct);
        return workspace;
    }

    public async Task UpdateAsync(Workspace workspace, CancellationToken ct = default)
    {
        context.Workspaces.Update(workspace);
        await context.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var workspace = await GetByIdAsync(id, ct);
        if (workspace is not null)
        {
            context.Workspaces.Remove(workspace);
            await context.SaveChangesAsync(ct);
        }
    }
}
