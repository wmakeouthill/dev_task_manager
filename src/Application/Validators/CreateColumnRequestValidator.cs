using DevTaskManager.Application.DTOs;
using FluentValidation;

namespace DevTaskManager.Application.Validators;

public class CreateColumnRequestValidator : AbstractValidator<CreateColumnRequest>
{
    public CreateColumnRequestValidator()
    {
        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("Nome da coluna é obrigatório.")
            .MaximumLength(200).WithMessage("Nome não pode exceder 200 caracteres.");
        RuleFor(x => x.Ordem)
            .GreaterThanOrEqualTo(0).When(x => x.Ordem.HasValue)
            .WithMessage("Ordem não pode ser negativa.");
    }
}
