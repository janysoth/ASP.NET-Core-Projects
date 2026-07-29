using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Mappers;

public static class RecurringBillTemplateMapper
{
  /*===========================================================
    ToResponse:
    => Converts a recurring bill template into a response DTO.

    IMPORTANT:
    => Recurring bill templates now represent Fixed Expense
       bills only.
    => They are no longer used for account transfers or
       credit-card payments.
  ===========================================================*/
  public static RecurringBillTemplateResponse ToResponse(
    RecurringBillTemplate template)
  {
    return new RecurringBillTemplateResponse
    {
      Id =
        template.Id,

      CategoryName =
        template.CategoryName ??
        string.Empty,

      Name =
        template.Name,

      ExpectedAmount =
        template.ExpectedAmount,

      DueDay =
        template.DueDay,

      IsActive =
        template.IsActive,

      Notes =
        template.Notes,

      CreatedAtUtc =
        template.CreatedAtUtc
    };
  }
}