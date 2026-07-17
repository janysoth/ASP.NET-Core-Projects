namespace TaskManager.Api.Features.Budget.DTOs.Dashboard;

public sealed record DashboardSummaryResponse
{
  public decimal TotalCash { get; set; }

  public decimal TotalCreditCardDebt { get; set; }

  public decimal NetWorth { get; set; }

  public decimal CurrentMonthPlannedIncome { get; set; }

  public decimal CurrentMonthTotalIncome { get; set; }

  public decimal CurrentMonthTotalExpenses { get; set; }

  public decimal CurrentMonthLeftToAssign { get; set; }

  public decimal CurrentMonthRemainingExpenseBudget { get; set; }

  public decimal PlannedFixedExpenses { get; set; }

  public decimal ActualFixedExpenses { get; set; }

  public decimal RemainingFixedExpenseBudget { get; set; }

  public decimal PlannedVariableExpenses { get; set; }

  public decimal ActualVariableExpenses { get; set; }

  public decimal RemainingVariableExpenseBudget { get; set; }

  public int TotalBills { get; set; }

  public int PaidBills { get; set; }

  public int UnpaidBills { get; set; }

  public int OverdueBills { get; set; }

  public decimal ExpectedBillsTotal { get; set; }

  public decimal PaidBillsTotal { get; set; }

  public List<BudgetCategoryResponse>
    FixedExpenseComparisons
  { get; set; } = [];

  public List<BudgetCategoryResponse>
    VariableExpenseComparisons
  { get; set; } = [];

  public List<BudgetCategoryResponse>
    SavingsComparisons
  { get; set; } = [];

  public List<BillResponse>
    UpcomingBills
  { get; set; } = [];
}