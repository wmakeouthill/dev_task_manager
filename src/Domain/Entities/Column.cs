using DevTaskManager.Domain.Exceptions;

namespace DevTaskManager.Domain.Entities;

public class Column
{
    public Guid Id { get; private set; }
    public Guid BoardId { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public int Ordem { get; private set; }
    public int? WipLimit { get; private set; }

    private Column() { }

    internal static Column Criar(Guid boardId, string nome, int ordem)
    {
        if (ordem < 0)
            throw new RegraDeNegocioException("Ordem da coluna não pode ser negativa.");
        return new Column
        {
            Id = Guid.NewGuid(),
            BoardId = boardId,
            Nome = nome.Trim(),
            Ordem = ordem,
            WipLimit = null
        };
    }

    internal void DefinirOrdem(int ordem)
    {
        if (ordem < 0)
            throw new RegraDeNegocioException("Ordem da coluna não pode ser negativa.");
        Ordem = ordem;
    }

    public void AtualizarNome(string nome)
    {
        if (string.IsNullOrWhiteSpace(nome))
            throw new RegraDeNegocioException("Nome da coluna não pode ser vazio.");
        Nome = nome.Trim();
    }

    public void DefinirWipLimit(int? wipLimit)
    {
        if (wipLimit.HasValue && wipLimit.Value < 0)
            throw new RegraDeNegocioException("WIP limit não pode ser negativo.");
        WipLimit = wipLimit;
    }
}
