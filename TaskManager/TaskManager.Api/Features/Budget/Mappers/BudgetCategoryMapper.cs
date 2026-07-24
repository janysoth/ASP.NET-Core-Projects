using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Mappers;

public static class BudgetCategoryMapper
{
  /*===========================================================
    ToResponse:
    => Converts a BudgetCategory model into a response DTO.
    => Calculates actual spending using CategoryId.
    => Calculates the remaining category budget.
    => Identifies whether the category is over budget.
  ===========================================================*/
  public static BudgetCategoryResponse ToResponse(
    BudgetCategory category,
    IReadOnlyCollection<ExpenseRecord> expenses)
  {
    /*---------------------------------------------------------
      Calculate how much has been spent in this category.

      Expenses now store CategoryId instead of the category
      name.

      Example:

      BudgetCategory.Id:
      12345

      ExpenseRecord.CategoryId:
      12345

      This means renaming a category will no longer break the
      relationship between the category and its expenses.
    ---------------------------------------------------------*/
    var spentAmount = expenses
      .Where(expense =>
        expense.CategoryId == category.Id)
      .Sum(expense =>
        expense.Amount);

    /*---------------------------------------------------------
      Calculate how much of the planned category budget
      remains.

      Example:

      PlannedAmount = $600
      SpentAmount   = $200

      RemainingAmount = $400
    ---------------------------------------------------------*/
    var remainingAmount =
      category.PlannedAmount -
      spentAmount;

    /*---------------------------------------------------------
      Convert the database model into the response DTO.
    ---------------------------------------------------------*/
    return new BudgetCategoryResponse
    {
      Id =
        category.Id,

      BudgetMonthId =
        category.BudgetMonthId,

      Name =
        category.Name,

      Type =
        category.Type,

      ExpenseType =
        category.ExpenseType,

      PlannedAmount =
        category.PlannedAmount,

      SpentAmount =
        spentAmount,

      RemainingAmount =
        remainingAmount,

      IsOverBudget =
        remainingAmount < 0,

      CreatedAtUtc =
        category.CreatedAtUtc
    };
  }
}