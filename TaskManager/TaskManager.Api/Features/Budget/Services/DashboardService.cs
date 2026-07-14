using MongoDB.Driver;
// using TaskManager.Api.Features.Budget.DTOs;
// using TaskManager.Api.Features.Budget.Mappers;

namespace TaskManager.Api.Features.Budget.Services;

public class DashboardService : BudgetBaseService
{
  private readonly AccountService _accountService;
  private readonly BudgetMonthService _budgetMonthService;
  private readonly BillService _billService;

  public DashboardService(
    IMongoDatabase database,
    AccountService accountService,
    BudgetMonthService budgetMonthService,
    BillService billService) : base(database)
  {
    _accountService = accountService;
    _budgetMonthService = budgetMonthService;
    _billService = billService;
  }

  /*===========================================================
    GetDashboardSummaryAsync:
    => Builds the finance dashboard for one month.
    => Includes account balances, budget comparisons, and bill totals.
    => Returns empty monthly values when no budget month exists.
  ===========================================================*/
  public async Task<DashboardSummaryResponse> GetDashboardSummaryAsync(
    string userId,
    int month,
    int year)
  {
    var accounts = await _accountService.GetAccountsAsync(userId);

    var totalCash = accounts
      .Where(a =>
        a.Type.Equals(
          "Checking",
          StringComparison.OrdinalIgnoreCase) ||
        a.Type.Equals(
          "Savings",
          StringComparison.OrdinalIgnoreCase))
      .Sum(a => a.CurrentBalance);

    var totalCreditCardDebt = accounts
      .Where(a =>
        a.Type.Equals(
          "CreditCard",
          StringComparison.OrdinalIgnoreCase))
      .Sum(a => a.CurrentBalance);

    var netWorth = totalCash - totalCreditCardDebt;

    var dashboard = new DashboardSummaryResponse
    {
      TotalCash = totalCash,
      TotalCreditCardDebt = totalCreditCardDebt,
      NetWorth = netWorth
    };

    var budgetMonth = await BudgetMonths
      .Find(b =>
        b.UserId == userId &&
        b.Month == month &&
        b.Year == year)
      .FirstOrDefaultAsync();

    if (budgetMonth == null)
    {
      return dashboard;
    }

    var budgetResponse =
      await _budgetMonthService.GetBudgetMonthByIdAsync(
        budgetMonth.Id,
        userId);

    if (budgetResponse == null)
    {
      return dashboard;
    }

    var bills = await _billService.GetBillsAsync(
      userId,
      month,
      year);

    var today = DateTime.UtcNow.Date;

    dashboard.CurrentMonthPlannedIncome =
      budgetResponse.PlannedIncome;

    dashboard.CurrentMonthTotalIncome =
      budgetResponse.TotalIncome;

    dashboard.CurrentMonthTotalExpenses =
      budgetResponse.TotalExpenses;

    dashboard.CurrentMonthLeftToAssign =
      budgetResponse.LeftToAssign;

    dashboard.CurrentMonthRemainingExpenseBudget =
      budgetResponse.RemainingPlannedExpenseBudget;

    dashboard.TotalBills = bills.Count;

    dashboard.PaidBills = bills.Count(b => b.IsPaid);

    dashboard.UnpaidBills = bills.Count(b => !b.IsPaid);

    dashboard.OverdueBills = bills.Count(b =>
      !b.IsPaid && b.DueDate.Date < today);

    dashboard.ExpectedBillsTotal = bills.Sum(
      b => b.ExpectedAmount);

    dashboard.PaidBillsTotal = bills
      .Where(b => b.IsPaid)
      .Sum(b => b.ActualAmount ?? 0);

    dashboard.CategoryComparisons =
      budgetResponse.BudgetCategories.ToList();

    dashboard.UpcomingBills = bills
      .Where(b => !b.IsPaid)
      .OrderBy(b => b.DueDate)
      .Take(5)
      .ToList();

    return dashboard;
  }
}