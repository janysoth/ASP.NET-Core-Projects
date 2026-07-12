namespace TaskManager.Api.Features.Budget.DTOs.Transactions;

public sealed record TransactionResponse
{
  public string Id { get; set; } = string.Empty;

  // Income, Expense, or Transfer
  public string Type { get; set; } = string.Empty;

  // Income source, expense name, or transfer description
  public string Title { get; set; } = string.Empty;

  public string? Category { get; set; }

  public decimal Amount { get; set; }

  public DateTime TransactionDate { get; set; }

  public string? AccountId { get; set; }

  public string? AccountName { get; set; }

  public string? FromAccountId { get; set; }

  public string? FromAccountName { get; set; }

  public string? ToAccountId { get; set; }

  public string? ToAccountName { get; set; }

  public string? BudgetMonthId { get; set; }

  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; }
}