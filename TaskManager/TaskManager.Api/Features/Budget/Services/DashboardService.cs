using MongoDB.Driver;

namespace TaskManager.Api.Features.Budget.Services;

public class DashboardService : BudgetBaseService
{
  private readonly AccountService _accountService;
  private readonly BudgetMonthService _budgetMonthService;
  private readonly BillService _billService;
  private readonly TransactionService _transactionService;

  /*===========================================================
    DashboardService Constructor:
    => Receives the services needed to build the dashboard.
    => Uses account, budget month, bill, and transaction data.
  ===========================================================*/
  public DashboardService(
    IMongoDatabase database,
    AccountService accountService,
    BudgetMonthService budgetMonthService,
    BillService billService,
    TransactionService transactionService) : base(database)
  {
    _accountService = accountService;
    _budgetMonthService = budgetMonthService;
    _billService = billService;
    _transactionService = transactionService;
  }

  /*===========================================================
    GetDashboardSummaryAsync:
    => Builds the complete dashboard for one selected month.
    => Groups information into:
       - NetWorth
       - CashFlow
       - Spending
       - Savings
       - Bills
       - Accounts
       - RecentTransactions
  ===========================================================*/
  public async Task<DashboardSummaryResponse>
    GetDashboardSummaryAsync(
      string userId,
      int month,
      int year)
  {
    /*
      Get account balances first.

      Account balances are not tied to one budget month,
      so they can still be returned even when the selected
      budget month does not exist.
    */
    var accounts =
      await _accountService.GetAccountsAsync(
        userId);

    /*===========================================================
      ACCOUNT TOTALS
    ===========================================================*/

    /*
      Total checking balance.
    */
    var totalChecking =
      accounts
        .Where(account =>
          string.Equals(
            account.Type,
            FinancialAccountTypes.Checking,
            StringComparison.OrdinalIgnoreCase))
        .Sum(account =>
          account.CurrentBalance);

    /*
      Total savings balance.
    */
    var totalSavings =
      accounts
        .Where(account =>
          string.Equals(
            account.Type,
            FinancialAccountTypes.Savings,
            StringComparison.OrdinalIgnoreCase))
        .Sum(account =>
          account.CurrentBalance);

    /*
      Total cash:

      Checking
      +
      Savings
    */
    var totalCash =
      totalChecking +
      totalSavings;

    /*
      Total outstanding credit-card debt.
    */
    var totalCreditCardDebt =
      accounts
        .Where(account =>
          string.Equals(
            account.Type,
            FinancialAccountTypes.CreditCard,
            StringComparison.OrdinalIgnoreCase))
        .Sum(account =>
          account.CurrentBalance);

    /*
      Simplified net worth:

      Cash
      -
      Credit-card debt
    */
    var netWorth =
      totalCash -
      totalCreditCardDebt;

    /*===========================================================
      BUILD BASE DASHBOARD
    ===========================================================*/

    /*
      Account and net-worth information can be returned even
      when the selected budget month does not exist.
    */
    var dashboard =
      new DashboardSummaryResponse
      {
        NetWorth =
          new NetWorthSummaryResponse
          {
            TotalCash =
              totalCash,

            TotalCreditCardDebt =
              totalCreditCardDebt,

            NetWorth =
              netWorth
          },

        Accounts =
          new AccountSummaryResponse
          {
            TotalChecking =
              totalChecking,

            TotalSavings =
              totalSavings,

            TotalCreditCardDebt =
              totalCreditCardDebt,

            Accounts =
              accounts
                .OrderBy(account =>
                  account.Type)
                .ThenBy(account =>
                  account.Name)
                .ToList()
          }
      };

    /*===========================================================
      FIND SELECTED BUDGET MONTH
    ===========================================================*/

    var budgetMonth =
      await BudgetMonths
        .Find(existingBudgetMonth =>
          existingBudgetMonth.UserId == userId &&
          existingBudgetMonth.Month == month &&
          existingBudgetMonth.Year == year)
        .FirstOrDefaultAsync();

    /*
      If the selected month does not exist, return the account
      information already calculated above.
    */
    if (budgetMonth == null)
    {
      return dashboard;
    }

    /*===========================================================
      LOAD COMPLETE MONTH DATA
    ===========================================================*/

    var budgetResponse =
      await _budgetMonthService
        .GetBudgetMonthByIdAsync(
          budgetMonth.Id,
          userId);

    if (budgetResponse == null)
    {
      return dashboard;
    }

    /*
      Get all Fixed Expense bills for the selected month.
    */
    var bills =
      await _billService.GetBillsAsync(
        userId,
        month,
        year);

    /*
      Get transactions for the selected month.
    */
    var transactions =
      await _transactionService.GetTransactionsAsync(
        userId,
        month,
        year);

    /*===========================================================
      CASH FLOW
    ===========================================================*/

    dashboard.CashFlow =
      new CashFlowSummaryResponse
      {
        PlannedIncome =
          budgetResponse.PlannedIncome,

        ActualIncome =
          budgetResponse.TotalIncome,

        ActualExpenses =
          budgetResponse.TotalExpenses,

        NetCashFlow =
          budgetResponse.TotalIncome -
          budgetResponse.TotalExpenses,

        LeftToAssign =
          budgetResponse.LeftToAssign,

        RemainingExpenseBudget =
          budgetResponse.RemainingPlannedExpenseBudget
      };

    /*===========================================================
      SPENDING
    ===========================================================*/

    dashboard.Spending =
      new SpendingSummaryResponse
      {
        PlannedFixedExpenses =
          budgetResponse.TotalPlannedFixedExpenses,

        ActualFixedExpenses =
          budgetResponse.TotalFixedExpenses,

        RemainingFixedExpenseBudget =
          budgetResponse.RemainingFixedExpenseBudget,

        PlannedVariableExpenses =
          budgetResponse.TotalPlannedVariableExpenses,

        ActualVariableExpenses =
          budgetResponse.TotalVariableExpenses,

        RemainingVariableExpenseBudget =
          budgetResponse.RemainingVariableExpenseBudget,

        FixedExpenseComparisons =
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
            .OrderBy(category =>
              category.Name)
            .ToList(),

        VariableExpenseComparisons =
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
            .OrderBy(category =>
              category.Name)
            .ToList()
      };

    /*===========================================================
      SAVINGS
    ===========================================================*/

    dashboard.Savings =
      new SavingsSummaryResponse
      {
        PlannedSavings =
          budgetResponse.TotalPlannedSavings,

        SavingsComparisons =
          budgetResponse.BudgetCategories
            .Where(category =>
              string.Equals(
                category.Type,
                BudgetCategoryTypes.Savings,
                StringComparison.OrdinalIgnoreCase))
            .OrderBy(category =>
              category.Name)
            .ToList()
      };

    /*===========================================================
      BILLS
    ===========================================================*/

    /*
      Bills are now Fixed Expense obligations only.

      A bill is either:

      Paid

      or

      Unpaid:
      - Upcoming
      - Due Soon
      - Due Today
      - Overdue

      Expense bills no longer support Partially Paid.
    */

    var today =
      DateTime.UtcNow.Date;

    /*---------------------------------------------------------
      Count paid bills.
    ---------------------------------------------------------*/
    var paidBills =
      bills.Count(bill =>
        bill.IsPaid);

    /*---------------------------------------------------------
      Partial bill payments no longer exist.

      Keep this value at zero while the response DTO still
      contains PartiallyPaidBills.
    ---------------------------------------------------------*/
    var partiallyPaidBills =
      0;

    /*---------------------------------------------------------
      Count overdue unpaid bills.
    ---------------------------------------------------------*/
    var overdueBills =
      bills.Count(bill =>
        !bill.IsPaid &&
        bill.DueDate.Date < today);

    /*---------------------------------------------------------
      Count every bill that has not been paid.
    ---------------------------------------------------------*/
    var unpaidBills =
      bills.Count(bill =>
        !bill.IsPaid);

    /*---------------------------------------------------------
      Expected Bills Total:

      Sum of expected amounts for all Fixed Expense bills.

      Example:

      Mortgage = $1,600
      Internet = $80
      Dance    = $141

      Expected total = $1,821
    ---------------------------------------------------------*/
    var expectedBillsTotal =
      bills.Sum(bill =>
        bill.ExpectedAmount);

    /*---------------------------------------------------------
      Paid Bills Total:

      Uses the ACTUAL amount stored in the ExpenseRecord.

      Example:

      Internet expected = $80
      Actual payment     = $74

      PaidBillsTotal receives $74.

      Unpaid bills have ActualAmount = null and contribute $0.
    ---------------------------------------------------------*/
    var paidBillsTotal =
      bills
        .Where(bill =>
          bill.IsPaid)
        .Sum(bill =>
          bill.ActualAmount ?? 0);

    /*---------------------------------------------------------
      Upcoming bills:

      Show the next five unpaid bills ordered by due date.
    ---------------------------------------------------------*/
    var upcomingBills =
      bills
        .Where(bill =>
          !bill.IsPaid)
        .OrderBy(bill =>
          bill.DueDate)
        .Take(5)
        .ToList();

    dashboard.Bills =
      new BillSummaryResponse
      {
        TotalBills =
          bills.Count,

        PaidBills =
          paidBills,

        /*
          Kept for compatibility with the current dashboard DTO.

          Since bills can no longer be partially paid,
          this will always be zero.
        */
        PartiallyPaidBills =
          partiallyPaidBills,

        UnpaidBills =
          unpaidBills,

        OverdueBills =
          overdueBills,

        ExpectedBillsTotal =
          expectedBillsTotal,

        PaidBillsTotal =
          paidBillsTotal,

        UpcomingBills =
          upcomingBills
      };

    /*===========================================================
      RECENT TRANSACTIONS
    ===========================================================*/

    /*
      Shows the ten most recent financial transactions
      for the selected month.
    */
    dashboard.RecentTransactions =
      transactions
        .OrderByDescending(transaction =>
          transaction.TransactionDate)
        .ThenByDescending(transaction =>
          transaction.CreatedAtUtc)
        .Take(10)
        .ToList();

    return dashboard;
  }
}