using DevTaskManager.Domain.Entities;
using DevTaskManager.Domain.Interfaces;
using DevTaskManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DevTaskManager.Infrastructure.Repositories;

public class BoardRepository(AppDbContext context) : IBoardRepository
{
    public async Task<Board?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await context.Boards
            .Include(b => b.Columns.OrderBy(c => c.Ordem))
            .FirstOrDefaultAsync(b => b.Id == id, ct);

    public async Task<Board?> GetByColumnIdAsync(Guid columnId, CancellationToken ct = default)
    {
        var boardId = await context.Columns
            .Where(c => c.Id == columnId)
            .Select(c => c.BoardId)
            .FirstOrDefaultAsync(ct);
        if (boardId == default) return null;
        return await GetByIdAsync(boardId, ct);
    }

    public async Task<(IReadOnlyList<Board> Items, long Total)> ListByWorkspaceAsync(Guid workspaceId, int page, int size, CancellationToken ct = default)
    {
        var query = context.Boards
            .Where(b => b.WorkspaceId == workspaceId)
            .Include(b => b.Columns.OrderBy(c => c.Ordem))
            .OrderBy(b => b.CreatedAt);
        var total = await query.LongCountAsync(ct);
        var items = await query
            .Skip((page - 1) * size)
            .Take(size)
            .ToListAsync(ct);
        return (items, total);
    }

    public async Task<Board> SaveAsync(Board board, CancellationToken ct = default)
    {
        context.Boards.Add(board);
        await context.SaveChangesAsync(ct);
        return board;
    }

    public async Task UpdateAsync(Board board, CancellationToken ct = default)
    {
        context.Boards.Update(board);
        await context.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var board = await GetByIdAsync(id, ct);
        if (board is not null)
        {
            context.Boards.Remove(board);
            await context.SaveChangesAsync(ct);
        }
    }
}
