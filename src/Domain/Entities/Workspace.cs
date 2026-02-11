using DevTaskManager.Domain.Exceptions;
using DevTaskManager.Domain.ValueObjects;

namespace DevTaskManager.Domain.Entities;

public class Workspace
{
    public Guid Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public string OwnerId { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }

    private Workspace() { }

    public static Workspace Criar(string nome, string ownerId)
    {
        var title = Title.Of(nome);
        return new Workspace
        {
            Id = Guid.NewGuid(),
            Nome = title.Value,
            OwnerId = ownerId ?? throw new RegraDeNegocioException("Owner é obrigatório."),
            CreatedAt = DateTime.UtcNow
        };
    }

    public void AtualizarNome(string nome)
    {
        var title = Title.Of(nome);
        Nome = title.Value;
    }
}
