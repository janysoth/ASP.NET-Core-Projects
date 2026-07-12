namespace TaskManager.Api.Features.Budget.DTOs.Bills;

public sealed record CreateBillRequest
{
  public string BudgetCategoryId { get; set; } = string.Empty;

  public string Name { get; set; } = string.Empty;

  public decimal ExpectedAmount { get; set; }

  public DateTime DueDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record UpdateBillRequest
{
  public string BudgetCategoryId { get; set; } = string.Empty;

  public string Name { get; set; } = string.Empty;

  public decimal ExpectedAmount { get; set; }

  public DateTime DueDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record MarkBillPaidRequest
{
  public string AccountId { get; set; } = string.Empty;

  public decimal ActualAmount { get; set; }

  public DateTime PaidDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record BillResponse
{
  public string Id { get; set; } = string.Empty;

  public string BudgetMonthId { get; set; } = string.Empty;

  public string BudgetCategoryId { get; set; } = string.Empty;

  public string BudgetCategoryName { get; set; } = string.Empty;

  public string Name { get; set; } = string.Empty;

  public decimal ExpectedAmount { get; set; }

  public decimal? ActualAmount { get; set; }

  public DateTime DueDate { get; set; }

  public bool IsPaid { get; set; }

  public string Status { get; set; } = string.Empty;

  public string? ExpenseRecordId { get; set; }

  public string? AccountId { get; set; }

  public string? AccountName { get; set; }

  public DateTime? PaidDate { get; set; }

  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; }
}