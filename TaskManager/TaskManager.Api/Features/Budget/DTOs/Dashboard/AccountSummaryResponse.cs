namespace TaskManager.Api.Features.Budget.DTOs.Dashboard;

public sealed record AccountSummaryResponse
{
  /*===========================================================
    TotalChecking:
    => Combined current balance of all Checking accounts.
  ===========================================================*/
  public decimal TotalChecking { get; set; }

  /*===========================================================
    TotalSavings:
    => Combined current balance of all Savings accounts.
  ===========================================================*/
  public decimal TotalSavings { get; set; }

  /*===========================================================
    TotalCreditCardDebt:
    => Combined current balance owed across CreditCard accounts.
  ===========================================================*/
  public decimal TotalCreditCardDebt { get; set; }

  /*===========================================================
    Accounts:
    => Individual financial accounts and current balances.
  ===========================================================*/
  public List<FinancialAccountResponse> Accounts { get; set; } =
    [];
}