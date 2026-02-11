using DevTaskManager.Domain.Exceptions;

namespace DevTaskManager.Domain.Entities;

public class ChecklistItem
{
    public Guid Id { get; private set; }
    public Guid CardId { get; private set; }
    public string Texto { get; private set; } = string.Empty;
    public bool Concluido { get; private set; }
    public int Ordem { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private ChecklistItem() { }

    public static ChecklistItem Criar(Guid cardId, string texto, int ordem = 0)
    {
        if (string.IsNullOrWhiteSpace(texto))
            throw new RegraDeNegocioException("Texto do item de checklist não pode ser vazio.");

        return new ChecklistItem
        {
            Id = Guid.NewGuid(),
            CardId = cardId,
            Texto = texto.Trim(),
            Concluido = false,
            Ordem = ordem,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Toggle()
    {
        Concluido = !Concluido;
    }

    public void AtualizarTexto(string texto)
    {
        if (string.IsNullOrWhiteSpace(texto))
            throw new RegraDeNegocioException("Texto do item de checklist não pode ser vazio.");
        Texto = texto.Trim();
    }

    public void DefinirOrdem(int ordem)
    {
        if (ordem < 0)
            throw new RegraDeNegocioException("Ordem não pode ser negativa.");
        Ordem = ordem;
    }
}
