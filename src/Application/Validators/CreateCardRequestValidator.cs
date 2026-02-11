using DevTaskManager.Application.DTOs;
using FluentValidation;

namespace DevTaskManager.Application.Validators;

public class CreateCardRequestValidator : AbstractValidator<CreateCardRequest>
{
    public CreateCardRequestValidator()
    {
        RuleFor(x => x.ColumnId)
            .NotEmpty().WithMessage("Coluna é obrigatória.");
        RuleFor(x => x.Titulo)
            .NotEmpty().WithMessage("Título do card é obrigatório.")
            .MaximumLength(500).WithMessage("Título não pode exceder 500 caracteres.");
        RuleFor(x => x.Ordem)
            .GreaterThanOrEqualTo(0).WithMessage("Ordem não pode ser negativa.");
    }
}
