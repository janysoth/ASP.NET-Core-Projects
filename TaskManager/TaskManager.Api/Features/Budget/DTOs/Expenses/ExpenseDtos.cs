namespace TaskManager.Api.Features.Budget.DTOs.Expenses;

public sealed record CreateExpenseRequest
{
  public string AccountId { get; set; } = string.Empty;

  public string Category { get; set; } = string.Empty;

  public string Name { get; set; } = string.Empty;

  public decimal Amount { get; set; }

  public DateTime ExpenseDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record UpdateExpenseRequest
{
  public string AccountId { get; set; } = string.Empty;

  public string Category { get; set; } = string.Empty;

  public string Name { get; set; } = string.Empty;

  public decimal Amount { get; set; }

  public DateTime ExpenseDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record PatchExpenseRequest
{
  public string? AccountId { get; set; }

  public string? Category { get; set; }

  public string? Name { get; set; }

  public decimal? Amount { get; set; }

  public DateTime? ExpenseDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record ExpenseResponse
{
  public string Id { get; set; } = string.Empty;

  public string BudgetMonthId { get; set; } = string.Empty;

  public string AccountId { get; set; } = string.Empty;

  public string AccountName { get; set; } = string.Empty;

  public string Category { get; set; } = string.Empty;

  public string Name { get; set; } = string.Empty;

  public decimal Amount { get; set; }

  public DateTime ExpenseDate { get; set; }

  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; }
}