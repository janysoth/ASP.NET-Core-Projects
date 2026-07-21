namespace TaskManager.Api.Features.Budget.DTOs.Dashboard;

public sealed record SavingsSummaryResponse
{
  public decimal PlannedSavings { get; set; }

  public List<BudgetCategoryResponse>
    SavingsComparisons
  { get; set; } = [];
}
