using DevTaskManager.Application.DTOs;
using FluentValidation;

namespace DevTaskManager.Application.Validators;

public class UpdateWorkspaceRequestValidator : AbstractValidator<UpdateWorkspaceRequest>
{
    public UpdateWorkspaceRequestValidator()
    {
        RuleFor(x => x.Nome)
            .NotEmpty().WithMessage("Nome do workspace é obrigatório.")
            .MaximumLength(200).WithMessage("Nome não pode exceder 200 caracteres.");
    }
}
