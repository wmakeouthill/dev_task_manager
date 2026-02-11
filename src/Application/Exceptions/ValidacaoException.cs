using FluentValidation.Results;

namespace DevTaskManager.Application.Exceptions;

public class ValidacaoException(IEnumerable<ValidationFailure> failures) : Exception("Dados inválidos")
{
    public IEnumerable<string> Erros { get; } = failures.Select(f => f.ErrorMessage).ToList();
}
