using DevTaskManager.Application.DTOs;
using FluentValidation;

namespace DevTaskManager.Application.Validators;

public class MoveCardRequestValidator : AbstractValidator<MoveCardRequest>
{
    public MoveCardRequestValidator()
    {
        RuleFor(x => x.ColumnId)
            .NotEmpty().WithMessage("Coluna de destino é obrigatória.");
        RuleFor(x => x.Ordem)
            .GreaterThanOrEqualTo(0).WithMessage("Ordem não pode ser negativa.");
    }
}
