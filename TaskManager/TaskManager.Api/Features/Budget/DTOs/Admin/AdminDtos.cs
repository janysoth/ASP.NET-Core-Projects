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