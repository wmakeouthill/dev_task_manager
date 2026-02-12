using DevTaskManager.Domain.Entities;

namespace DevTaskManager.Domain.Interfaces;

public interface IInsightRepository
{
    Task<IReadOnlyList<Insight>> ListAsync(CancellationToken ct = default);
    Task<Insight> SaveAsync(Insight insight, CancellationToken ct = default);
    Task SaveManyAsync(IReadOnlyList<Insight> insights, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task DeleteAllAsync(CancellationToken ct = default);
}
