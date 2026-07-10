using MongoDB.Driver;
using TaskManager.Api.Features.Budget.DTOs;

namespace TaskManager.Api.Features.Budget.Services;

// Service responsible for building dashboard summary data.
// It combines account totals and current budget month totals
// into one response for the frontend dashboard.
public class DashboardService : BudgetBaseService
{
  // Service used to get financial accounts and current balances
  private readonly AccountService _accountService;

  // Service used to get budget month details and totals
  private readonly BudgetMonthService _budgetMonthService;

  // Constructor used for Dependency Injection (DI)
  public DashboardService(
    IMongoDatabase database,
    AccountService accountService,
    BudgetMonthService budgetMonthService) : base(database)
  {
    _accountService = accountService;
    _budgetMonthService = budgetMonthService;
  }

  // Builds the dashboard summary for the selected month and year
  public async Task<DashboardSummaryResponse> GetDashboardSummaryAsync(
    string userId,
    int month,
    int year)
  {
    // Get all financial accounts for the current user
    var accounts = await _accountService.GetAccountsAsync(userId);

    // Add up all checking and savings account balances
    var totalCash = accounts
      .Where(a =>
        a.Type.Equals("Checking", StringComparison.OrdinalIgnoreCase) ||
        a.Type.Equals("Savings", StringComparison.OrdinalIgnoreCase))
      .Sum(a => a.CurrentBalance);

    // Add up all credit card balances
    var totalCreditCardDebt = accounts
      .Where(a => a.Type.Equals("CreditCard", StringComparison.OrdinalIgnoreCase))
      .Sum(a => a.CurrentBalance);

    // Calculate net worth using cash minus credit card debt
    var netWorth = totalCash - totalCreditCardDebt;

    // Try to find the selected budget month
    var budgetMonth = await BudgetMonths
      .Find(b =>
        b.UserId == userId &&
        b.Month == month &&
        b.Year == year)
      .FirstOrDefaultAsync();

    // If there is no budget month yet, still return
    // the account summary totals
    if (budgetMonth == null)
    {
      return new DashboardSummaryResponse
      {
        TotalCash = totalCash,
        TotalCreditCardDebt = totalCreditCardDebt,
        NetWorth = netWorth
      };
    }

    // Get the full budget month response with calculated totals
    var budgetMonthResponse = await _budgetMonthService.GetBudgetMonthByIdAsync(
      budgetMonth.Id,
      userId);

    // If the budget month response cannot be built,
    // still return the account summary totals
    if (budgetMonthResponse == null)
    {
      return new DashboardSummaryResponse
      {
        TotalCash = totalCash,
        TotalCreditCardDebt = totalCreditCardDebt,
        NetWorth = netWorth
      };
    }

    // Return the full dashboard summary
    return new DashboardSummaryResponse
    {
      // Account summary totals
      TotalCash = totalCash,
      TotalCreditCardDebt = totalCreditCardDebt,
      NetWorth = netWorth,

      // Current budget month totals
      CurrentMonthPlannedIncome = budgetMonthResponse.PlannedIncome,
      CurrentMonthTotalIncome = budgetMonthResponse.TotalIncome,
      CurrentMonthTotalExpenses = budgetMonthResponse.TotalExpenses,
      CurrentMonthLeftToAssign = budgetMonthResponse.LeftToAssign,
      CurrentMonthRemainingExpenseBudget =
        budgetMonthResponse.RemainingPlannedExpenseBudget
    };
  }
}