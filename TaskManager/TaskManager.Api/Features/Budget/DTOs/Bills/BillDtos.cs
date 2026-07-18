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

public sealed record CreateRecurringBillTemplateRequest
{
  public string Name { get; set; } = string.Empty;

  public string CategoryName { get; set; } = string.Empty;

  public string CategoryType { get; set; } = BudgetCategoryTypes.Expense;

  public decimal ExpectedAmount { get; set; }

  public int DueDay { get; set; }

  public bool IsActive { get; set; } = true;

  public string? Notes { get; set; }
}

public sealed record UpdateRecurringBillTemplateRequest
{
  public string Name { get; set; } = string.Empty;

  public string CategoryName { get; set; } = string.Empty;

  public string CategoryType { get; set; } = BudgetCategoryTypes.Expense;

  public decimal ExpectedAmount { get; set; }

  public int DueDay { get; set; }

  public bool IsActive { get; set; }

  public string? Notes { get; set; }
}

public sealed record RecurringBillTemplateResponse
{
  public string Id { get; set; } = string.Empty;

  public string Name { get; set; } = string.Empty;

  public string CategoryName { get; set; } = string.Empty;

  public string CategoryType { get; set; } = string.Empty;

  public decimal ExpectedAmount { get; set; }

  public int DueDay { get; set; }

  public bool IsActive { get; set; }

  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; }
}

public sealed record GenerateBillsRequest
{
  public int Month { get; set; }

  public int Year { get; set; }
}

public sealed record GenerateBillsResponse
{
  public int TargetMonth { get; set; }

  public int TargetYear { get; set; }

  public int TotalTemplates { get; set; }

  public int CreatedBills { get; set; }

  public int SkippedExistingBills { get; set; }

  public int SkippedMissingCategories { get; set; }

  public List<BillResponse> Bills { get; set; } = [];

  public List<string> Messages { get; set; } = [];
}