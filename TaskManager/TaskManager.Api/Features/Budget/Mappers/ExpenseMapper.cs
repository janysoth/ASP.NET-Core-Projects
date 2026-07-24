using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Mappers;

public static class ExpenseMapper
{
  // Converts an ExpenseRecord database model into an ExpenseResponse DTO.
  //
  // The expense stores only CategoryId.
  // Therefore, the category name must be loaded separately by the service
  // and passed into this method.
  public static ExpenseResponse ToResponse(
    ExpenseRecord expense,
    string categoryName)
  {
    return new ExpenseResponse
    {
      Id = expense.Id,
      BudgetMonthId = expense.BudgetMonthId,
      AccountId = expense.AccountId,
      CategoryId = expense.CategoryId,
      CategoryName = categoryName,
      Name = expense.Name,
      Amount = expense.Amount,
      ExpenseDate = expense.ExpenseDate,
      Notes = expense.Notes,
      CreatedAtUtc = expense.CreatedAtUtc
    };
  }
}