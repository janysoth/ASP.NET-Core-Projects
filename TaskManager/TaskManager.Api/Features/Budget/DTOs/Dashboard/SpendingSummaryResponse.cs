namespace TaskManager.Api.Features.Budget.DTOs.Dashboard;

public sealed record SpendingSummaryResponse
{
  public decimal PlannedFixedExpenses { get; set; }

  public decimal ActualFixedExpenses { get; set; }

  public decimal RemainingFixedExpenseBudget { get; set; }

  public decimal PlannedVariableExpenses { get; set; }

  public decimal ActualVariableExpenses { get; set; }

  public decimal RemainingVariableExpenseBudget { get; set; }

  public List<BudgetCategoryResponse>
    FixedExpenseComparisons
  { get; set; } = [];

  public List<BudgetCategoryResponse>
    VariableExpenseComparisons
  { get; set; } = [];
}