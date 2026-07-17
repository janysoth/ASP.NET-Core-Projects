namespace TaskManager.Api.Features.Budget.DTOs.BudgetMonths;

public sealed record BudgetMonthResponse
{
  public string Id { get; set; } = string.Empty;

  public int Month { get; set; }

  public int Year { get; set; }

  public decimal PlannedIncome { get; set; }

  // Actual income received during the budget month.
  public decimal TotalIncome { get; set; }

  // All actual expenses.
  public decimal TotalExpenses { get; set; }

  // Actual income minus actual expenses.
  public decimal RemainingBalance { get; set; }

  // All planned Expense categories.
  public decimal TotalPlannedExpenses { get; set; }

  // Planned Expense categories classified as Fixed.
  public decimal TotalPlannedFixedExpenses { get; set; }

  // Planned Expense categories classified as Variable.
  public decimal TotalPlannedVariableExpenses { get; set; }

  // Actual spending in Fixed categories.
  public decimal TotalFixedExpenses { get; set; }

  // Actual spending in Variable categories.
  public decimal TotalVariableExpenses { get; set; }

  // Fixed planned budget minus actual fixed spending.
  public decimal RemainingFixedExpenseBudget { get; set; }

  // Variable planned budget minus actual variable spending.
  public decimal RemainingVariableExpenseBudget { get; set; }

  // All planned Savings categories.
  public decimal TotalPlannedSavings { get; set; }

  // Expense categories + Savings categories.
  public decimal TotalAssigned { get; set; }

  // PlannedIncome minus TotalAssigned.
  public decimal LeftToAssign { get; set; }

  // Total planned expenses minus actual expenses.
  public decimal RemainingPlannedExpenseBudget { get; set; }

  public IReadOnlyList<BudgetCategoryResponse>
    BudgetCategories
  { get; set; } = [];

  public IReadOnlyList<IncomeResponse>
    IncomeRecords
  { get; set; } = [];

  public IReadOnlyList<ExpenseResponse>
    ExpenseRecords
  { get; set; } = [];

  public DateTime CreatedAtUtc { get; set; }
}

public sealed record CreateBudgetMonthRequest
{
  public int Month { get; set; }

  public int Year { get; set; }

  public decimal PlannedIncome { get; set; }
}

public sealed record UpdateBudgetMonthRequest
{
  public decimal PlannedIncome { get; set; }
}