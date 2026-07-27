namespace TaskManager.Api.Features.Budget.DTOs.BudgetCategories;

public sealed record BudgetCategoryResponse
{
  public string Id { get; set; } = string.Empty;

  public string BudgetMonthId { get; set; } = string.Empty;

  /*
    Main category type:

    Expense
    Savings
  */
  public string Type { get; set; } = string.Empty;

  /*
    Only used when Type = Expense.

    Fixed
    Variable
  */
  public string? ExpenseType { get; set; }

  public string Name { get; set; } = string.Empty;

  /*
    Manual planned amount.

    Used for:
    - Variable Expense categories
    - Savings categories

    Fixed Expense categories get their planned amount
    automatically from linked bills.
  */
  public decimal PlannedAmount { get; set; }

  /*
    Total Bill.ExpectedAmount for Expense bills
    linked to this category.
  */
  public decimal BillPlannedAmount { get; set; }

  /*
    Effective planned amount for this category.

    Fixed Expense:
    => BillPlannedAmount

    Variable Expense:
    => PlannedAmount

    Savings:
    => PlannedAmount
  */
  public decimal TotalPlannedAmount { get; set; }

  /*
    Actual ExpenseRecord spending in this category.
  */
  public decimal SpentAmount { get; set; }

  /*
    TotalPlannedAmount - SpentAmount
  */
  public decimal RemainingAmount { get; set; }

  public bool IsOverBudget { get; set; }

  public DateTime CreatedAtUtc { get; set; }
}

public sealed record CreateBudgetCategoryRequest
{
  public string Name { get; set; } = string.Empty;

  /*
    Expense
    Savings
  */
  public string Type { get; set; } = string.Empty;

  /*
    Fixed or Variable.

    Required only when Type = Expense.
  */
  public string? ExpenseType { get; set; }

  public decimal PlannedAmount { get; set; }
}

public sealed record UpdateBudgetCategoryRequest
{
  public string Name { get; set; } = string.Empty;

  public string Type { get; set; } = string.Empty;

  public string? ExpenseType { get; set; }

  public decimal PlannedAmount { get; set; }
}