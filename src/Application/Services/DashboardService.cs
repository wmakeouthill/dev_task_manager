using DevTaskManager.Application.DTOs;
using DevTaskManager.Domain.Entities;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Application.Services;

public class DashboardService(
    IWorkspaceRepository workspaceRepo,
    IBoardRepository boardRepo,
    ICardRepository cardRepo,
    IReminderRepository reminderRepo)
{
    public async Task<DashboardDto> ExecuteAsync(CancellationToken ct = default)
    {
        var (workspaces, totalWorkspaces) = await workspaceRepo.ListAsync(1, 1000, ct);
        var totalBoards = 0;
        var allCards = new List<Card>();

        foreach (var ws in workspaces)
        {
            var (boards, boardCount) = await boardRepo.ListByWorkspaceAsync(ws.Id, 1, 1000, ct);
            totalBoards += (int)boardCount;

            foreach (var board in boards)
            {
                var (cards, _) = await cardRepo.ListByBoardAsync(board.Id, 1, 10000, ct: ct);
                allCards.AddRange(cards);
            }
        }

        var now = DateTime.UtcNow;
        var overdue = allCards
            .Where(c => c.DueDate.HasValue && c.DueDate.Value < now && c.Status != CardStatus.Done)
            .OrderBy(c => c.DueDate)
            .ToList();

        var recent = allCards
            .OrderByDescending(c => c.CreatedAt)
            .Take(5)
            .ToList();

        var pendingReminders = await reminderRepo.GetPendingAsync(now.AddDays(7), ct);

        return new DashboardDto(
            TotalCards: allCards.Count,
            CardsTodo: allCards.Count(c => c.Status == CardStatus.Todo),
            CardsInProgress: allCards.Count(c => c.Status == CardStatus.InProgress),
            CardsDone: allCards.Count(c => c.Status == CardStatus.Done),
            CardsOverdue: overdue.Count,
            TotalBoards: totalBoards,
            TotalWorkspaces: (int)totalWorkspaces,
            PendingReminders: pendingReminders.Count,
            RecentCards: recent.Select(CardDto.From).ToList(),
            OverdueCards: overdue.Take(5).Select(CardDto.From).ToList());
    }
}
