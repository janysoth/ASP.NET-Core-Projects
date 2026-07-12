using TaskManager.Api.Features.Budget.DTOs.BudgetCategories;
using TaskManager.Api.Features.Budget.DTOs.Expenses;
using TaskManager.Api.Features.Budget.DTOs.Income;

namespace TaskManager.Api.Features.Budget.DTOs.BudgetMonths;

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

public sealed record BudgetMonthResponse
{
  public string Id { get; set; } = string.Empty;

  public int Month { get; set; }

  public int Year { get; set; }

  public decimal PlannedIncome { get; set; }

  // Actual money received during the budget month
  public decimal TotalIncome { get; set; }

  // Actual money spent during the budget month
  public decimal TotalExpenses { get; set; }

  // Actual income minus actual expenses
  public decimal RemainingBalance { get; set; }

  // Total planned amount for Expense categories
  public decimal TotalPlannedExpenses { get; set; }

  // Total planned amount for Savings categories
  public decimal TotalPlannedSavings { get; set; }

  // Total planned amount for Debt categories
  public decimal TotalPlannedDebt { get; set; }

  // Expense + Savings + Debt planned amounts
  public decimal TotalAssigned { get; set; }

  // Planned income minus total assigned
  public decimal LeftToAssign { get; set; }

  // Planned expense budget minus actual expenses
  public decimal RemainingPlannedExpenseBudget { get; set; }

  public IReadOnlyList<BudgetCategoryResponse> BudgetCategories { get; set; } = [];

  public IReadOnlyList<IncomeResponse> IncomeRecords { get; set; } = [];

  public IReadOnlyList<ExpenseResponse> ExpenseRecords { get; set; } = [];

  public DateTime CreatedAtUtc { get; set; }
}