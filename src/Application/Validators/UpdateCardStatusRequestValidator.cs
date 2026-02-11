using DevTaskManager.Application.DTOs;
using FluentValidation;
using DevTaskManager.Domain.Entities;

namespace DevTaskManager.Application.Validators;

public class UpdateCardStatusRequestValidator : AbstractValidator<UpdateCardStatusRequest>
{
    public UpdateCardStatusRequestValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Status é obrigatório.")
            .Must(s => Enum.TryParse<CardStatus>(s, ignoreCase: true, out _))
            .WithMessage("Status deve ser Todo, InProgress ou Done.");
    }
}
