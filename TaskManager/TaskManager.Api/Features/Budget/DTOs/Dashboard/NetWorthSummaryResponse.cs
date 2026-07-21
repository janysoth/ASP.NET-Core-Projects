namespace TaskManager.Api.Features.Budget.DTOs.Dashboard;

public sealed record NetWorthSummaryResponse
{
  public decimal TotalCash { get; set; }

  public decimal TotalCreditCardDebt { get; set; }

  public decimal NetWorth { get; set; }
}