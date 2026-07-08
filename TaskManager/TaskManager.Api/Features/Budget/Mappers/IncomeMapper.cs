using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Mappers;

// Static helper class responsible for converting
// IncomeRecord models into IncomeResponse DTOs.
public static class IncomeMapper
{
  // Converts an IncomeRecord model into a response DTO.
  public static IncomeResponse ToResponse(
    IncomeRecord income,
    FinancialAccount? account = null)
  {
    // Create and return a response object
    return new IncomeResponse
    {
      // Copy the income ID
      Id = income.Id,

      // Copy the budget month ID this income belongs to
      BudgetMonthId = income.BudgetMonthId,

      // Copy the financial account ID where the income was deposited
      AccountId = income.AccountId,

      // Copy the Account Name
      AccountName = account?.Name ?? string.Empty,

      // Copy the income source
      Source = income.Source,

      // Copy the income amount
      Amount = income.Amount,

      // Copy the date the income was received
      IncomeDate = income.IncomeDate,

      // Copy any optional notes
      Notes = income.Notes,

      // Copy when the income record was created
      CreatedAtUtc = income.CreatedAtUtc
    };
  }
}