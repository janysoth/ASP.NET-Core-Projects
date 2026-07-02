using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Mappers;

public static class BudgetCategoryMapper
{
  public static BudgetCategoryResponse ToResponse(
    BudgetCategory category,
    List<ExpenseRecord> expenses)
  {
    var spentAmount = expenses
      .Where(e => string.Equals(
        e.Category,
        category.Name,
        StringComparison.OrdinalIgnoreCase))
      .Sum(e => e.Amount);

    return new BudgetCategoryResponse
    {
      Id = category.Id,
      BudgetMonthId = category.BudgetMonthId,
      Name = category.Name,
      Type = category.Type,
      PlannedAmount = category.PlannedAmount,
      SpentAmount = spentAmount,
      RemainingAmount = category.PlannedAmount - spentAmount,
      CreatedAtUtc = category.CreatedAtUtc
    };
  }
}