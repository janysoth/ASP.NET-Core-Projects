namespace TaskManager.Api.Features.Budget.DTOs.Admin;

public sealed record DeleteAllBudgetDataRequest
{
  public string Confirmation { get; set; } = string.Empty;
}

public sealed record CleanSlateResponse
{
  public long DeletedAccounts { get; set; }

  public long DeletedTransfers { get; set; }

  public long DeletedBudgetMonths { get; set; }

  public long DeletedBudgetCategories { get; set; }

  public long DeletedIncomeRecords { get; set; }

  public long DeletedExpenseRecords { get; set; }

  public long DeletedBills { get; set; }

  public long DeletedRecurringBillTemplates { get; set; }
}

public sealed record DeleteBudgetGroupRequest
{
  public string Confirmation { get; set; } =
    string.Empty;
}

public sealed record DeleteBudgetGroupResponse
{
  public string Group { get; init; } =
    string.Empty;

  public long DeletedCount { get; init; }

  public long DeletedIncomeRecords { get; init; }

  public long DeletedExpenseRecords { get; init; }

  public long DeletedTransfers { get; init; }

  public long DeletedBills { get; init; }

  public long DeletedRecurringTemplates { get; init; }

  public long DeletedCategories { get; init; }

  public long DeletedBudgetMonths { get; init; }

  public long DeletedAccounts { get; init; }

  public long UnlinkedTransfers { get; init; }

  public long UnlinkedBills { get; init; }
}