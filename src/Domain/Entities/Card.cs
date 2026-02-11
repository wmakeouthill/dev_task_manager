using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.ValueObjects;

namespace DevTaskManager.Domain.Entities;

public enum CardStatus
{
    Todo = 0,
    InProgress = 1,
    Done = 2
}

public class Card
{
    public Guid Id { get; private set; }
    public Guid BoardId { get; private set; }
    public Guid ColumnId { get; private set; }
    public string Titulo { get; private set; } = string.Empty;
    public string? Descricao { get; private set; }
    public CardStatus Status { get; private set; }
    public int Ordem { get; private set; }
    public DateTime? DueDate { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private Card() { }

    public static Card Criar(Guid boardId, Guid columnId, string titulo, string? descricao = null, int ordem = 0)
    {
        var title = Title.Of(titulo);
        return new Card
        {
            Id = Guid.NewGuid(),
            BoardId = boardId,
            ColumnId = columnId,
            Titulo = title.Value,
            Descricao = descricao?.Trim(),
            Status = CardStatus.Todo,
            Ordem = ordem,
            DueDate = null,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void AtualizarTitulo(string titulo)
    {
        var title = Title.Of(titulo);
        Titulo = title.Value;
    }

    public void AtualizarDescricao(string? descricao)
    {
        Descricao = string.IsNullOrWhiteSpace(descricao) ? null : descricao.Trim();
    }

    public void DefinirDueDate(DateTime? dueDate)
    {
        if (dueDate.HasValue && dueDate.Value < CreatedAt)
            throw new RegraDeNegocioException("Data de vencimento não pode ser anterior à data de criação.");
        DueDate = dueDate;
    }

    public void AtualizarStatus(CardStatus status)
    {
        Status = status;
    }

    public void MoverPara(Guid columnId, int ordem)
    {
        if (ordem < 0)
            throw new RegraDeNegocioException("Ordem do card não pode ser negativa.");
        ColumnId = columnId;
        Ordem = ordem;
    }

    public void DefinirOrdem(int ordem)
    {
        if (ordem < 0)
            throw new RegraDeNegocioException("Ordem do card não pode ser negativa.");
        Ordem = ordem;
    }
}
