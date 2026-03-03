using System.Diagnostics;
using DevTaskManager.Application.DTOs;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Application.Services;

public class AiNoteAssistService
{
    public async Task<AiNoteAssistResponse> ExecuteAsync(AiNoteAssistRequest request, IAiProvider provider, CancellationToken ct = default)
    {
        var sw = Stopwatch.StartNew();

        var aiRequest = new AiRequest(
            Action: BuildNoteAction(request.Action),
            CardTitle: "Nota",
            CardDescription: request.Content,
            CardStatus: null,
            ChecklistItems: null);

        var response = await provider.ExecuteAsync(aiRequest, ct);
        sw.Stop();

        return new AiNoteAssistResponse(
            response.Content,
            response.Provider,
            sw.Elapsed.TotalMilliseconds);
    }

    private static string BuildNoteAction(string action) => action.ToLowerInvariant() switch
    {
        "help" or "ajudar" => "note-help",
        "fix" or "corrigir" => "note-fix",
        "organize" or "organizar" => "note-organize",
        "expand" or "expandir" => "note-expand",
        _ => "note-help"
    };
}
