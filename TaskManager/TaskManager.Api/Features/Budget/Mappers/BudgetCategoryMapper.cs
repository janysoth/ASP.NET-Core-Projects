using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Mappers;

public static class BudgetCategoryMapper
{
  /*===========================================================
    ToResponse:
    => Converts a BudgetCategory model into a response DTO.
    => Calculates actual spending using CategoryId.
    => Calculates planned bill amounts for Fixed expenses.
    => Calculates the effective planned category budget.
    => Calculates the remaining category budget.
    => Identifies whether the category is over budget.

    Budget Rules:

    Fixed Expense:
    => Planned budget comes from linked Bill.ExpectedAmount.

    Variable Expense:
    => Planned budget comes from category.PlannedAmount.

    Savings:
    => Planned budget comes from category.PlannedAmount.
  ===========================================================*/
  public static BudgetCategoryResponse ToResponse(
    BudgetCategory category,
    IReadOnlyCollection<ExpenseRecord> expenses,
    IReadOnlyCollection<Bill>? bills = null)
  {
    /*
      Use an empty bill collection when bills were not supplied.

      This keeps the mapper compatible with existing code while
      we update the remaining services step-by-step.
    */
    var availableBills =
      bills ?? Array.Empty<Bill>();

    /*---------------------------------------------------------
      Calculate actual spending for this category.

      ExpenseRecord stores CategoryId instead of the category
      name.

      Example:

      BudgetCategory.Id:
      12345

      ExpenseRecord.CategoryId:
      12345

      Renaming the category does not break the relationship.
    ---------------------------------------------------------*/
    var spentAmount =
      expenses
        .Where(expense =>
          expense.CategoryId ==
            category.Id)
        .Sum(expense =>
          expense.Amount);

    /*---------------------------------------------------------
      Determine whether this is a Fixed Expense category.

      Example:

      Type        = Expense
      ExpenseType = Fixed
    ---------------------------------------------------------*/
    var isFixedExpense =
      string.Equals(
        category.Type,
        "Expense",
        StringComparison.OrdinalIgnoreCase) &&
      string.Equals(
        category.ExpenseType,
        "Fixed",
        StringComparison.OrdinalIgnoreCase);

    /*---------------------------------------------------------
      Calculate the amount automatically budgeted from bills.

      Only Expense bills linked to this category count.

      Example:

      Internet = $80
      Phone    = $120

      BillPlannedAmount = $200

      Transfer bills such as credit-card payments are NOT
      included because they are movements between accounts,
      not new expenses.
    ---------------------------------------------------------*/
    var billPlannedAmount =
      availableBills
        .Where(bill =>
          string.Equals(
            bill.PaymentType,
            "Expense",
            StringComparison.OrdinalIgnoreCase) &&
          bill.BudgetCategoryId ==
            category.Id)
        .Sum(bill =>
          bill.ExpectedAmount);

    /*---------------------------------------------------------
      Determine the effective planned amount.

      Fixed Expense:
      => Uses Bill.ExpectedAmount totals.

      Variable Expense:
      => Uses BudgetCategory.PlannedAmount.

      Savings:
      => Uses BudgetCategory.PlannedAmount.

      This prevents a Fixed category from being counted twice.
    ---------------------------------------------------------*/
    var totalPlannedAmount =
      isFixedExpense
        ? billPlannedAmount
        : category.PlannedAmount;

    /*---------------------------------------------------------
      Calculate the remaining category budget.

      Fixed Example:

      Internet Bill    = $80
      Actual Payment   = $74

      Remaining Budget = $6

      Variable Example:

      Groceries Budget = $600
      Spent             = $200

      Remaining Budget = $400
    ---------------------------------------------------------*/
    var remainingAmount =
      totalPlannedAmount -
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

      /*
        Preserve the manually stored amount.

        For Fixed Expense categories this may be zero because
        the effective planned amount comes from bills.
      */
      PlannedAmount =
        category.PlannedAmount,

      /*
        Amount automatically planned from linked bills.
      */
      BillPlannedAmount =
        billPlannedAmount,

      /*
        The amount actually used for budgeting.

        Fixed:
        => BillPlannedAmount

        Variable / Savings:
        => PlannedAmount
      */
      TotalPlannedAmount =
        totalPlannedAmount,

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