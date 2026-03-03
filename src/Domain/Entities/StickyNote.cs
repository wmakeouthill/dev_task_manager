namespace DevTaskManager.Domain.Entities;

public class StickyNote
{
    public Guid Id { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Content { get; private set; } = string.Empty;
    public string Color { get; private set; } = "yellow";
    public double PositionX { get; private set; }
    public double PositionY { get; private set; }
    public double Width { get; private set; } = 280;
    public double Height { get; private set; } = 220;
    public int ZIndex { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private StickyNote() { }

    public static StickyNote Criar(string title, string content, string color, double x, double y)
    {
        return new StickyNote
        {
            Id = Guid.NewGuid(),
            Title = title.Trim(),
            Content = content.Trim(),
            Color = color.Trim(),
            PositionX = x,
            PositionY = y,
            Width = 280,
            Height = 220,
            ZIndex = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
    }

    public void AtualizarConteudo(string title, string content, string color)
    {
        Title = title.Trim();
        Content = content.Trim();
        Color = color.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    public void AtualizarPosicao(double x, double y, double width, double height, int zIndex)
    {
        PositionX = x;
        PositionY = y;
        Width = width;
        Height = height;
        ZIndex = zIndex;
        UpdatedAt = DateTime.UtcNow;
    }
}
