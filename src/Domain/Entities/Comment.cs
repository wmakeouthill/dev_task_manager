using DevTaskManager.Domain.Exceptions;

namespace DevTaskManager.Domain.Entities;

public class Comment
{
    public Guid Id { get; private set; }
    public Guid CardId { get; private set; }
    public string Autor { get; private set; } = string.Empty;
    public string Texto { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }

    private Comment() { }

    public static Comment Criar(Guid cardId, string autor, string texto)
    {
        if (string.IsNullOrWhiteSpace(texto))
            throw new RegraDeNegocioException("Texto do comentário não pode ser vazio.");

        return new Comment
        {
            Id = Guid.NewGuid(),
            CardId = cardId,
            Autor = string.IsNullOrWhiteSpace(autor) ? "local-dev" : autor.Trim(),
            Texto = texto.Trim(),
            CreatedAt = DateTime.UtcNow
        };
    }

    public void AtualizarTexto(string texto)
    {
        if (string.IsNullOrWhiteSpace(texto))
            throw new RegraDeNegocioException("Texto do comentário não pode ser vazio.");
        Texto = texto.Trim();
    }
}
