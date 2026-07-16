using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Mappers;

public static class BudgetCategoryMapper
{
  /*===========================================================
    ToResponse:
    => Converts a BudgetCategory model into a response DTO.
    => Calculates actual spending and remaining budget.
    => Identifies whether the category is over budget.
  ===========================================================*/
  public static BudgetCategoryResponse ToResponse(
    BudgetCategory category,
    IReadOnlyCollection<ExpenseRecord> expenses)
  {
    var spentAmount = expenses
      .Where(e => string.Equals(
        e.Category,
        category.Name,
        StringComparison.OrdinalIgnoreCase))
      .Sum(e => e.Amount);

    var remainingAmount =
      category.PlannedAmount - spentAmount;

    return new BudgetCategoryResponse
    {
      Id = category.Id,
      BudgetMonthId = category.BudgetMonthId,
      Name = category.Name,
      Type = category.Type,
      ExpenseType = category.ExpenseType,
      PlannedAmount = category.PlannedAmount,
      SpentAmount = spentAmount,
      RemainingAmount = remainingAmount,
      IsOverBudget = remainingAmount < 0,
      CreatedAtUtc = category.CreatedAtUtc
    };
  }
}