namespace TaskManager.Api.Features.Budget.DTOs.BudgetCategories;

public sealed record CreateBudgetCategoryRequest
{
  public string Name { get; set; } = string.Empty;

  // Allowed values:
  // Expense
  // Savings
  public string Type { get; set; } = BudgetCategoryTypes.Expense;

  // Required for Expense.
  // Must be Fixed or Variable.
  // Must be null for Savings.
  public string? ExpenseType { get; set; }

  public decimal PlannedAmount { get; set; }
}

public sealed record UpdateBudgetCategoryRequest
{
  public string Name { get; set; } = string.Empty;

  // Allowed values:
  // Expense
  // Savings
  public string Type { get; set; } = BudgetCategoryTypes.Expense;

  // Required for Expense.
  // Must be Fixed or Variable.
  // Must be null for Savings.
  public string? ExpenseType { get; set; }

  public decimal PlannedAmount { get; set; }
}

public sealed record BudgetCategoryResponse
{
  public string Id { get; set; } = string.Empty;

  public string BudgetMonthId { get; set; } = string.Empty;

  public string Name { get; set; } = string.Empty;

  public string Type { get; set; } = string.Empty;

  public string? ExpenseType { get; set; }

  public decimal PlannedAmount { get; set; }

  public decimal SpentAmount { get; set; }

  public decimal RemainingAmount { get; set; }

  public bool IsOverBudget { get; set; }

  public DateTime CreatedAtUtc { get; set; }
}