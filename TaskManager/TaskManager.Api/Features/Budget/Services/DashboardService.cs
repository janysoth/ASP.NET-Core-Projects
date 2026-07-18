using MongoDB.Driver;

namespace TaskManager.Api.Features.Budget.Services;

public class DashboardService : BudgetBaseService
{
  private readonly AccountService _accountService;
  private readonly BudgetMonthService _budgetMonthService;
  private readonly BillService _billService;

  /*===========================================================
    DashboardService Constructor:
    => Receives the services needed to build the dashboard.
    => Uses AccountService for balances, BudgetMonthService for
       monthly budget details, and BillService for bill information.
  ===========================================================*/
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
    => Builds the finance dashboard for one selected month.
    => Includes account balances, net worth, budget totals,
       fixed and variable comparisons, and bill information.
    => Returns account totals even if the selected budget month
       does not exist.
  ===========================================================*/
  public async Task<DashboardSummaryResponse> GetDashboardSummaryAsync(
    string userId,
    int month,
    int year)
  {
    // Get all financial accounts with calculated current balances.
    var accounts = await _accountService.GetAccountsAsync(userId);

    // Checking and savings accounts are treated as available cash.
    var totalCash = accounts
      .Where(account =>
        string.Equals(
          account.Type,
          FinancialAccountTypes.Checking,
          StringComparison.OrdinalIgnoreCase) ||
        string.Equals(
          account.Type,
          FinancialAccountTypes.Savings,
          StringComparison.OrdinalIgnoreCase))
      .Sum(account => account.CurrentBalance);

    // Credit card balances are treated as debt.
    var totalCreditCardDebt = accounts
      .Where(account => string.Equals(
        account.Type,
        FinancialAccountTypes.CreditCard,
        StringComparison.OrdinalIgnoreCase))
      .Sum(account => account.CurrentBalance);

    // Simplified current net worth calculation.
    var netWorth = totalCash - totalCreditCardDebt;

    // Create the basic dashboard response first.
    // These totals can still be returned without a budget month.
    var dashboard = new DashboardSummaryResponse
    {
      TotalCash = totalCash,
      TotalCreditCardDebt = totalCreditCardDebt,
      NetWorth = netWorth
    };

    // Find the user's budget month using the requested month and year.
    var budgetMonth = await BudgetMonths
      .Find(budget =>
        budget.UserId == userId &&
        budget.Month == month &&
        budget.Year == year)
      .FirstOrDefaultAsync();

    // If no budget exists for the requested month,
    // return only the account and net-worth information.
    if (budgetMonth == null)
    {
      return dashboard;
    }

    // Build the complete budget-month response.
    // This includes planned, actual, fixed, and variable totals.
    var budgetResponse =
      await _budgetMonthService.GetBudgetMonthByIdAsync(
        budgetMonth.Id,
        userId);

    if (budgetResponse == null)
    {
      return dashboard;
    }

    // Get all bills associated with the selected month and year.
    var bills = await _billService.GetBillsAsync(
      userId,
      month,
      year);

    var today = DateTime.UtcNow.Date;

    // Monthly zero-based budget information.
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

    // Fixed expense comparison.
    dashboard.PlannedFixedExpenses =
      budgetResponse.TotalPlannedFixedExpenses;

    dashboard.ActualFixedExpenses =
      budgetResponse.TotalFixedExpenses;

    dashboard.RemainingFixedExpenseBudget =
      budgetResponse.RemainingFixedExpenseBudget;

    // Variable expense comparison.
    dashboard.PlannedVariableExpenses =
      budgetResponse.TotalPlannedVariableExpenses;

    dashboard.ActualVariableExpenses =
      budgetResponse.TotalVariableExpenses;

    dashboard.RemainingVariableExpenseBudget =
      budgetResponse.RemainingVariableExpenseBudget;

    // Bill summary counts.
    dashboard.TotalBills = bills.Count;

    dashboard.PaidBills =
      bills.Count(bill => bill.IsPaid);

    dashboard.UnpaidBills =
      bills.Count(bill => !bill.IsPaid);

    dashboard.OverdueBills =
      bills.Count(bill =>
        !bill.IsPaid &&
        bill.DueDate.Date < today);

    // Expected total uses every bill's planned amount.
    dashboard.ExpectedBillsTotal =
      bills.Sum(bill => bill.ExpectedAmount);

    // Paid total uses the linked expense's actual payment amount.
    dashboard.PaidBillsTotal = bills
      .Where(bill => bill.IsPaid)
      .Sum(bill => bill.ActualAmount ?? 0);

    // Fixed expense category planned-versus-actual details.
    dashboard.FixedExpenseComparisons =
      budgetResponse.BudgetCategories
        .Where(category =>
          string.Equals(
            category.Type,
            BudgetCategoryTypes.Expense,
            StringComparison.OrdinalIgnoreCase) &&
          string.Equals(
            category.ExpenseType,
            ExpenseTypes.Fixed,
            StringComparison.OrdinalIgnoreCase))
        .OrderBy(category => category.Name)
        .ToList();

    // Variable expense category planned-versus-actual details.
    dashboard.VariableExpenseComparisons =
      budgetResponse.BudgetCategories
        .Where(category =>
          string.Equals(
            category.Type,
            BudgetCategoryTypes.Expense,
            StringComparison.OrdinalIgnoreCase) &&
          string.Equals(
            category.ExpenseType,
            ExpenseTypes.Variable,
            StringComparison.OrdinalIgnoreCase))
        .OrderBy(category => category.Name)
        .ToList();

    // Savings category planned-versus-actual details.
    dashboard.SavingsComparisons =
      budgetResponse.BudgetCategories
        .Where(category => string.Equals(
          category.Type,
          BudgetCategoryTypes.Savings,
          StringComparison.OrdinalIgnoreCase))
        .OrderBy(category => category.Name)
        .ToList();

    // Show the next five unpaid bills by due date.
    dashboard.UpcomingBills = bills
      .Where(bill => !bill.IsPaid)
      .OrderBy(bill => bill.DueDate)
      .Take(5)
      .ToList();

    return dashboard;
  }
}