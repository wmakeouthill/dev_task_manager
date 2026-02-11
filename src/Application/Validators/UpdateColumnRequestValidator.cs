using DevTaskManager.Application.DTOs;
using FluentValidation;

namespace DevTaskManager.Application.Validators;

public class UpdateColumnRequestValidator : AbstractValidator<UpdateColumnRequest>
{
    public UpdateColumnRequestValidator()
    {
        RuleFor(x => x.Nome)
            .MaximumLength(200).When(x => !string.IsNullOrEmpty(x.Nome))
            .WithMessage("Nome não pode exceder 200 caracteres.");
        RuleFor(x => x.WipLimit)
            .GreaterThanOrEqualTo(0).When(x => x.WipLimit.HasValue)
            .WithMessage("WIP limit não pode ser negativo.");
    }
}
