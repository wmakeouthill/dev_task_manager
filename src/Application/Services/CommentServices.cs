using DevTaskManager.Application.DTOs;
using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.Interfaces;

namespace DevTaskManager.Application.Services;

public class AddCommentService(ICommentRepository commentRepo, ICardRepository cardRepo)
{
    public async Task<CommentDto> ExecuteAsync(Guid cardId, CreateCommentRequest request, CancellationToken ct = default)
    {
        var card = await cardRepo.GetByIdAsync(cardId, ct)
            ?? throw new EntidadeNaoEncontradaException("Card", cardId);

        var comment = Domain.Entities.Comment.Criar(cardId, request.Autor ?? "local-dev", request.Texto);
        await commentRepo.SaveAsync(comment, ct);
        return CommentDto.From(comment);
    }
}

public class ListCommentsService(ICommentRepository commentRepo)
{
    public async Task<PagedResponse<CommentDto>> ExecuteAsync(Guid cardId, int page, int size, CancellationToken ct = default)
    {
        var (items, total) = await commentRepo.ListByCardAsync(cardId, page, size, ct);
        var totalPages = size > 0 ? (int)Math.Ceiling(total / (double)size) : 0;
        return new PagedResponse<CommentDto>(
            items.Select(CommentDto.From).ToList(),
            page,
            size,
            total,
            totalPages,
            page >= totalPages || items.Count < size);
    }
}

public class DeleteCommentService(ICommentRepository commentRepo)
{
    public async Task ExecuteAsync(Guid id, CancellationToken ct = default)
    {
        _ = await commentRepo.GetByIdAsync(id, ct)
            ?? throw new EntidadeNaoEncontradaException("Comentário", id);
        await commentRepo.DeleteAsync(id, ct);
    }
}
