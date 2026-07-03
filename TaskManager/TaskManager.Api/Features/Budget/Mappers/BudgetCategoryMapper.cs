using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Mappers;

// Static helper class responsible for converting
// BudgetCategory models into BudgetCategoryResponse DTOs.
public static class BudgetCategoryMapper
{
  // Converts a BudgetCategory model into a response DTO.
  public static BudgetCategoryResponse ToResponse(
    BudgetCategory category,
    List<ExpenseRecord> expenses)
  {
    // Calculate how much has been spent in this category.
    // Category names are compared without considering
    // uppercase or lowercase letters.
    var spentAmount = expenses
      .Where(e => string.Equals(
        e.Category,
        category.Name,
        StringComparison.OrdinalIgnoreCase))
      .Sum(e => e.Amount);

    // Create and return a response object
    return new BudgetCategoryResponse
    {
      // Copy the category ID
      Id = category.Id,

      // Copy the budget month ID this category belongs to
      BudgetMonthId = category.BudgetMonthId,

      // Copy the category name
      Name = category.Name,

      // Copy the category type
      Type = category.Type,

      // Copy the planned budget amount
      PlannedAmount = category.PlannedAmount,

      // Set the calculated amount already spent
      SpentAmount = spentAmount,

      // Calculate the remaining budget
      RemainingAmount = category.PlannedAmount - spentAmount,

      // Copy when the category was created
      CreatedAtUtc = category.CreatedAtUtc
    };
  }
}