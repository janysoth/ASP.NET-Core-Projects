using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Mappers;

// Static helper class responsible for converting
// ExpenseRecord models into ExpenseResponse DTOs.
public static class ExpenseMapper
{
  // Converts an ExpenseRecord model into a response DTO.
  public static ExpenseResponse ToResponse(
    ExpenseRecord expense,
    FinancialAccount? account = null)
  {
    // Create and return a response object
    return new ExpenseResponse
    {
      // Copy the expense ID
      Id = expense.Id,

      // Copy the budget month ID this expense belongs to
      BudgetMonthId = expense.BudgetMonthId,

      // Copy the financial account ID used for this expense
      AccountId = expense.AccountId,

      // Copy the Account Name
      AccountName = account?.Name ?? string.Empty,

      // Copy the expense category
      Category = expense.Category,

      // Copy the expense name or description
      Name = expense.Name,

      // Copy the expense amount
      Amount = expense.Amount,

      // Copy the date the expense occurred
      ExpenseDate = expense.ExpenseDate,

      // Copy any optional notes
      Notes = expense.Notes,

      // Copy when the expense record was created
      CreatedAtUtc = expense.CreatedAtUtc
    };
  }
}