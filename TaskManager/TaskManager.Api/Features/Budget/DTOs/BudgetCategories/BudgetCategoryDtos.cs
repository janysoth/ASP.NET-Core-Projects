namespace TaskManager.Api.Features.Budget.DTOs.BudgetCategories;

public sealed record CreateBudgetCategoryRequest
{
  public string Name { get; set; } = string.Empty;

  public string Type { get; set; } = "Expense";

  public decimal PlannedAmount { get; set; }
}

public sealed record UpdateBudgetCategoryRequest
{
  public string Name { get; set; } = string.Empty;

  public string Type { get; set; } = "Expense";

  public decimal PlannedAmount { get; set; }
}

public sealed record BudgetCategoryResponse
{
  public string Id { get; set; } = string.Empty;

  public string BudgetMonthId { get; set; } = string.Empty;

  public string Name { get; set; } = string.Empty;

  public string Type { get; set; } = string.Empty;

  public decimal PlannedAmount { get; set; }

  public decimal SpentAmount { get; set; }

  public decimal RemainingAmount { get; set; }

  public DateTime CreatedAtUtc { get; set; }
}