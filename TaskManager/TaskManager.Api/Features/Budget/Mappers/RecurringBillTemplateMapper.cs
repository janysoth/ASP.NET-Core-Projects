using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Mappers;

public static class RecurringBillTemplateMapper
{
  /*===========================================================
    ToResponse:
    => Converts a recurring template into a response DTO.
    => Includes the destination CreditCard name for Transfer
       templates when available.
  ===========================================================*/
  public static RecurringBillTemplateResponse ToResponse(
    RecurringBillTemplate template,
    FinancialAccount? destinationAccount = null)
  {
    return new RecurringBillTemplateResponse
    {
      Id = template.Id,
      PaymentType = template.PaymentType,

      CategoryName = template.CategoryName,

      DestinationAccountId =
        template.DestinationAccountId,

      DestinationAccountName =
        destinationAccount?.Name,

      Name = template.Name,
      ExpectedAmount = template.ExpectedAmount,
      DueDay = template.DueDay,
      IsActive = template.IsActive,
      Notes = template.Notes,
      CreatedAtUtc = template.CreatedAtUtc
    };
  }
}