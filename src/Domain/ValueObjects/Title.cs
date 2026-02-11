using DevTaskManager.Domain.Exceptions;

namespace DevTaskManager.Domain.ValueObjects;

public sealed record Title
{
    public const int MaxLength = 200;
    public const int MinLength = 1;

    public string Value { get; }

    private Title(string value) => Value = value;

    public static Title Of(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new RegraDeNegocioException("Título não pode ser vazio.");
        var trimmed = value.Trim();
        if (trimmed.Length > MaxLength)
            throw new RegraDeNegocioException($"Título não pode exceder {MaxLength} caracteres.");
        return new Title(trimmed);
    }

    public static implicit operator string(Title title) => title.Value;
}
