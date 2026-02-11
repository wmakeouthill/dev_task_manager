using DevTaskManager.Application.DTOs;
using FluentValidation;

namespace DevTaskManager.Application.Validators;

public class MoveColumnRequestValidator : AbstractValidator<MoveColumnRequest>
{
    public MoveColumnRequestValidator()
    {
        RuleFor(x => x.NovaOrdem)
            .GreaterThanOrEqualTo(0).WithMessage("Ordem não pode ser negativa.");
    }
}
