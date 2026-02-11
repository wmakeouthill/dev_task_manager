using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.ValueObjects;

namespace DevTaskManager.Domain.Entities;

public class Board
{
    public Guid Id { get; private set; }
    public Guid WorkspaceId { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }

    private readonly List<Column> _columns = [];
    public IReadOnlyCollection<Column> Columns => _columns.AsReadOnly();

    private Board() { }

    public static Board Criar(Guid workspaceId, string nome)
    {
        var title = Title.Of(nome);
        return new Board
        {
            Id = Guid.NewGuid(),
            WorkspaceId = workspaceId,
            Nome = title.Value,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void AtualizarNome(string nome)
    {
        var title = Title.Of(nome);
        Nome = title.Value;
    }

    public Column AdicionarColuna(string nome, int ordem)
    {
        if (string.IsNullOrWhiteSpace(nome))
            throw new RegraDeNegocioException("Nome da coluna não pode ser vazio.");
        if (_columns.Any(c => c.Nome.Equals(nome.Trim(), StringComparison.OrdinalIgnoreCase)))
            throw new RegraDeNegocioException("Já existe uma coluna com esse nome no board.");
        var col = Column.Criar(Id, nome.Trim(), ordem);
        _columns.Add(col);
        return col;
    }

    public void ReordenarColuna(Guid columnId, int novaOrdem)
    {
        var col = _columns.FirstOrDefault(c => c.Id == columnId)
            ?? throw new EntidadeNaoEncontradaException("Coluna", columnId);
        col.DefinirOrdem(novaOrdem);
        _columns.Sort((a, b) => a.Ordem.CompareTo(b.Ordem));
    }

    public void RemoverColuna(Guid columnId)
    {
        var col = _columns.FirstOrDefault(c => c.Id == columnId)
            ?? throw new EntidadeNaoEncontradaException("Coluna", columnId);
        _columns.Remove(col);
    }
}
