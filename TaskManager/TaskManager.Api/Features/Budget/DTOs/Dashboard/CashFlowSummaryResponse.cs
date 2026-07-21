namespace TaskManager.Api.Features.Budget.DTOs.Dashboard;

public sealed record CashFlowSummaryResponse
{
  public decimal PlannedIncome { get; set; }

  public decimal ActualIncome { get; set; }

  public decimal ActualExpenses { get; set; }

  public decimal NetCashFlow { get; set; }

  public decimal LeftToAssign { get; set; }

  public decimal RemainingExpenseBudget { get; set; }
}