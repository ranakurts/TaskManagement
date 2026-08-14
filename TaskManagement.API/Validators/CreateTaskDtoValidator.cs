using FluentValidation;
using TaskManagement.Core.DTOs;

namespace TaskManagement.API.Validators;

public class CreateTaskDtoValidator : AbstractValidator<CreateTaskDto>
{
    public CreateTaskDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title boş olamaz.")
            .MaximumLength(100);

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description boş olamaz.")
            .MinimumLength(5);

        RuleFor(x => x.Priority)
            .IsInEnum()
            .WithMessage("Geçersiz öncelik değeri.");

        RuleFor(x => x.Status)
            .IsInEnum()
            .WithMessage("Geçersiz görev durumu.");

        RuleFor(x => x.EndDate)
            .GreaterThan(x => x.StartDate)
            .WithMessage("EndDate, StartDate'den sonra olmalıdır.");
    }
}