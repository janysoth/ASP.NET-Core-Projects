namespace TaskManager.Api.Features.Budget.DTOs.Dashboard;

public sealed record BillSummaryResponse
{
  public int TotalBills { get; set; }

  public int PaidBills { get; set; }

  public int PartiallyPaidBills { get; set; }

  public int UnpaidBills { get; set; }

  public int OverdueBills { get; set; }

  public decimal ExpectedBillsTotal { get; set; }

  public decimal PaidBillsTotal { get; set; }

  public List<BillResponse>
    UpcomingBills
  { get; set; } = [];
}