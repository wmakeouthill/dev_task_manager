using System.Diagnostics;
using DevTaskManager.Application.DTOs;
using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Application.Services;

public class AiActionService(IAiProvider aiProvider, ICardRepository cardRepo, IChecklistItemRepository checklistRepo)
{
    public async Task<AiActionResponse> ExecuteAsync(AiActionRequest request, CancellationToken ct = default)
    {
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
}
