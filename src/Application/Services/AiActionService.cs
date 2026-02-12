using System.Diagnostics;
using System.Text;
using DevTaskManager.Application.DTOs;
using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Application.Services;

public class AiActionService(ICardRepository cardRepo, IChecklistItemRepository checklistRepo)
{
    private static readonly HashSet<string> GlobalActions = new(StringComparer.OrdinalIgnoreCase)
    {
        "board-insights", "bottlenecks", "priorities", "risks", "sprint-review", "daily-insights"
    };

    public async Task<AiActionResponse> ExecuteAsync(AiActionRequest request, IAiProvider aiProvider, CancellationToken ct = default)
    {
        // Ações globais: usam todos os cards com AiEnabled
        if (GlobalActions.Contains(request.Action))
            return await ExecuteGlobalAsync(request.Action, aiProvider, ct);

        // Ação específica de card
        var card = await cardRepo.GetByIdAsync(request.CardId, ct)
            ?? throw new EntidadeNaoEncontradaException("Card", request.CardId);

        var checklist = await checklistRepo.ListByCardAsync(request.CardId, ct);
        var checklistTexts = checklist.Select(c => $"[{(c.Concluido ? "x" : " ")}] {c.Texto}").ToList();

        var aiRequest = new AiRequest(
            request.Action,
            card.Titulo,
            card.Descricao,
            card.Status.ToString(),
            checklistTexts);

        var sw = Stopwatch.StartNew();
        var response = await aiProvider.ExecuteAsync(aiRequest, ct);
        sw.Stop();

        return new AiActionResponse(response.Content, response.Provider, sw.Elapsed.TotalMilliseconds);
    }

    private async Task<AiActionResponse> ExecuteGlobalAsync(string action, IAiProvider aiProvider, CancellationToken ct)
    {
        var cards = await cardRepo.ListAiEnabledAsync(ct);
        if (cards.Count == 0)
            return new AiActionResponse(
                "Nenhum card com 'Insights IA' habilitado. Ative a flag 🤖 nos cards que deseja analisar.",
                aiProvider.ProviderName, 0);

        var sb = new StringBuilder();
        sb.AppendLine($"Ação: {action}");
        sb.AppendLine($"Total de cards analisados: {cards.Count}");
        sb.AppendLine();
        foreach (var card in cards)
        {
            sb.AppendLine($"- **{card.Titulo}** (Status: {card.Status}, Prazo: {card.DueDate?.ToString("dd/MM/yyyy") ?? "sem prazo"})");
            if (!string.IsNullOrWhiteSpace(card.Descricao))
                sb.AppendLine($"  Descrição: {(card.Descricao.Length > 100 ? card.Descricao[..100] + "..." : card.Descricao)}");
        }

        var aiRequest = new AiRequest(action, "Visão Global", sb.ToString(), null, null);

        var sw = Stopwatch.StartNew();
        var response = await aiProvider.ExecuteAsync(aiRequest, ct);
        sw.Stop();

        return new AiActionResponse(response.Content, response.Provider, sw.Elapsed.TotalMilliseconds);
    }

    public async Task<PerCardInsightsResponse> ExecutePerCardAsync(string action, IAiProvider aiProvider, CancellationToken ct)
    {
        var cards = await cardRepo.ListAiEnabledAsync(ct);
        if (cards.Count == 0)
            return new PerCardInsightsResponse([], 0, 0);

        var totalSw = Stopwatch.StartNew();
        var results = new List<CardInsightResult>();

        foreach (var card in cards)
        {
            var checklist = await checklistRepo.ListByCardAsync(card.Id, ct);
            var checklistTexts = checklist.Select(c => $"[{(c.Concluido ? "x" : " ")}] {c.Texto}").ToList();

            var aiRequest = new AiRequest(
                action,
                card.Titulo,
                card.Descricao,
                card.Status.ToString(),
                checklistTexts);

            var sw = Stopwatch.StartNew();
            var response = await aiProvider.ExecuteAsync(aiRequest, ct);
            sw.Stop();

            results.Add(new CardInsightResult(
                card.Id,
                card.Titulo,
                card.Status.ToString(),
                response.Content,
                response.Provider,
                sw.Elapsed.TotalMilliseconds));
        }

        totalSw.Stop();
        return new PerCardInsightsResponse(results, cards.Count, totalSw.Elapsed.TotalMilliseconds);
    }
}
