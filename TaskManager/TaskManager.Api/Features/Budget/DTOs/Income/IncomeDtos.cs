namespace TaskManager.Api.Features.Budget.DTOs.Income;

public sealed record CreateIncomeRequest
{
  public string AccountId { get; set; } = string.Empty;

  public string Source { get; set; } = string.Empty;

  public decimal Amount { get; set; }

  public DateTime IncomeDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record UpdateIncomeRequest
{
  public string AccountId { get; set; } = string.Empty;

  public string Source { get; set; } = string.Empty;

  public decimal Amount { get; set; }

  public DateTime IncomeDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record PatchIncomeRequest
{
  public string? AccountId { get; set; }

  public string? Source { get; set; }

  public decimal? Amount { get; set; }

  public DateTime? IncomeDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record IncomeResponse
{
  public string Id { get; set; } = string.Empty;

  public string BudgetMonthId { get; set; } = string.Empty;

  public string AccountId { get; set; } = string.Empty;

  public string AccountName { get; set; } = string.Empty;

  public string Source { get; set; } = string.Empty;

  public decimal Amount { get; set; }

  public DateTime IncomeDate { get; set; }

  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; }
}