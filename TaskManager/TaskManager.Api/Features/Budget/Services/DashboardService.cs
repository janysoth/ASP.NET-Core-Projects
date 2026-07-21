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

    /*
      Total cash:
      Checking + Savings balances.
    */
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
      .Sum(account =>
        account.CurrentBalance);

    /*
      Total credit-card debt:
      Sum of all CreditCard account balances.
    */
    var totalCreditCardDebt = accounts
      .Where(account =>
        string.Equals(
          account.Type,
          FinancialAccountTypes.CreditCard,
          StringComparison.OrdinalIgnoreCase))
      .Sum(account =>
        account.CurrentBalance);

    /*
      Simplified net worth used by this app:

      Checking
      + Savings
      - CreditCard balances
    */
    var netWorth =
      totalCash -
      totalCreditCardDebt;

    /*
      Start building the grouped dashboard response.
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
          accounts
      };

    /*
      Find the selected budget month.
    */
    var budgetMonth = await BudgetMonths
      .Find(b =>
        b.UserId == userId &&
        b.Month == month &&
        b.Year == year)
      .FirstOrDefaultAsync();

    /*
      If no budget month exists, return the account
      and net-worth data that we already have.
    */
    if (budgetMonth == null)
    {
      return dashboard;
    }

    /*
      Get the complete budget-month response.

      This includes:
      - planned income
      - actual income
      - actual expenses
      - fixed/variable totals
      - category comparisons
    */
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
      Get all bills for the selected month.
    */
    var bills =
      await _billService.GetBillsAsync(
        userId,
        month,
        year);

    /*
      Get transactions for the selected month.

      The dashboard will show only the most recent transactions.
    */
    var transactions =
      await _transactionService.GetTransactionsAsync(
        userId,
        month,
        year);

    /*===========================================================
      Cash Flow:
      => Planned income and actual monthly movement.
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
      Spending:
      => Fixed and Variable planned-versus-actual comparisons.
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
      Savings:
      => Planned savings categories for the selected month.
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

    /*
      Determine today's date once for bill calculations.
    */
    var today =
      DateTime.UtcNow.Date;

    /*===========================================================
      Bills:
      => Includes regular Expense bills and Transfer bills.
      => Transfer bill status may be:
         Unpaid
         Partially Paid
         Paid
    ===========================================================*/
    var paidBills =
      bills.Count(bill =>
        string.Equals(
          bill.Status,
          "Paid",
          StringComparison.OrdinalIgnoreCase));

    var partiallyPaidBills =
      bills.Count(bill =>
        string.Equals(
          bill.Status,
          "Partially Paid",
          StringComparison.OrdinalIgnoreCase));

    var overdueBills =
      bills.Count(bill =>
        !string.Equals(
          bill.Status,
          "Paid",
          StringComparison.OrdinalIgnoreCase) &&
        bill.DueDate.Date <
          today);

    /*
      UnpaidBills represents bills that are not fully paid.

      This includes:
      - Upcoming
      - Due Soon
      - Due Today
      - Overdue

      It does not include Partially Paid because that has
      its own separate dashboard count.
    */
    var unpaidBills =
      bills.Count(bill =>
        !string.Equals(
          bill.Status,
          "Paid",
          StringComparison.OrdinalIgnoreCase) &&
        !string.Equals(
          bill.Status,
          "Partially Paid",
          StringComparison.OrdinalIgnoreCase));

    /*
      Expected Bills Total:
      Sum of the expected amount for all bills.
    */
    var expectedBillsTotal =
      bills.Sum(bill =>
        bill.ExpectedAmount);

    /*
      Paid Bills Total:
      Expense bills:
      => ActualAmount from the ExpenseRecord.

      Transfer bills:
      => TotalPaid from all linked transfers.
    */
    var paidBillsTotal =
      bills.Sum(bill =>
        bill.TotalPaid);

    /*
      Upcoming bills:
      Show bills that are not fully paid.

      A Partially Paid bill remains visible because
      there is still money remaining.
    */
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
      Recent Transactions:
      => Shows the most recent monthly transactions.
      => Includes income, expenses, and transfers.
    ===========================================================*/
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