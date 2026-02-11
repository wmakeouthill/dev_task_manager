using DevTaskManager.Application.DTOs;
using FluentValidation;

namespace DevTaskManager.Application.Validators;

public class UpdateBoardRequestValidator : AbstractValidator<UpdateBoardRequest>
{
    public UpdateBoardRequestValidator()
    {
        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("Nome do board é obrigatório.")
            .MaximumLength(200).WithMessage("Nome não pode exceder 200 caracteres.");
    }
}
