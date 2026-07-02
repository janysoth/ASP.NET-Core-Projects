using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Mappers;

public static class ExpenseMapper
{
  public static ExpenseResponse ToResponse(ExpenseRecord expense)
  {
    return new ExpenseResponse
    {
      Id = expense.Id,
      BudgetMonthId = expense.BudgetMonthId,
      AccountId = expense.AccountId,
      Category = expense.Category,
      Name = expense.Name,
      Amount = expense.Amount,
      ExpenseDate = expense.ExpenseDate,
      Notes = expense.Notes,
      CreatedAtUtc = expense.CreatedAtUtc
    };
  }
}