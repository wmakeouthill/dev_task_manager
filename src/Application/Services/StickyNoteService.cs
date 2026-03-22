using DevTaskManager.Application.DTOs;
using DevTaskManager.Domain.Entities;
using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Application.Services;

public class StickyNoteService(IStickyNoteRepository repository)
{
    public async Task<IReadOnlyList<StickyNoteDto>> ListAsync(Guid? boardId = null, CancellationToken ct = default)
    {
        var notes = await repository.ListAsync(boardId, ct);
        return notes.Select(StickyNoteDto.From).ToList();
    }

    public async Task<StickyNoteDto> GetAsync(Guid id, CancellationToken ct = default)
    {
        var note = await repository.GetByIdAsync(id, ct)
            ?? throw new EntidadeNaoEncontradaException("StickyNote", id);
        return StickyNoteDto.From(note);
    }

    public async Task<StickyNoteDto> CreateAsync(CreateStickyNoteRequest request, CancellationToken ct = default)
    {
        var note = StickyNote.Criar(
            request.Title,
            request.Content,
            request.Color,
            request.PositionX,
            request.PositionY,
            request.BoardId);
        var saved = await repository.SaveAsync(note, ct);
        return StickyNoteDto.From(saved);
    }

    public async Task<StickyNoteDto> UpdateAsync(Guid id, UpdateStickyNoteRequest request, CancellationToken ct = default)
    {
        var note = await repository.GetByIdAsync(id, ct)
            ?? throw new EntidadeNaoEncontradaException("StickyNote", id);
        note.AtualizarConteudo(request.Title, request.Content, request.Color);
        await repository.UpdateAsync(note, ct);
        return StickyNoteDto.From(note);
    }

    public async Task<StickyNoteDto> UpdatePositionAsync(Guid id, UpdateStickyNotePositionRequest request, CancellationToken ct = default)
    {
        var note = await repository.GetByIdAsync(id, ct)
            ?? throw new EntidadeNaoEncontradaException("StickyNote", id);
        note.AtualizarPosicao(request.PositionX, request.PositionY, request.Width, request.Height, request.ZIndex);
        await repository.UpdateAsync(note, ct);
        return StickyNoteDto.From(note);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var note = await repository.GetByIdAsync(id, ct)
            ?? throw new EntidadeNaoEncontradaException("StickyNote", id);
        await repository.DeleteAsync(note.Id, ct);
    }
}
