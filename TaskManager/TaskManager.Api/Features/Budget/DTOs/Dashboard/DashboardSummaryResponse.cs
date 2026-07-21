namespace TaskManager.Api.Features.Budget.DTOs.Dashboard;

public sealed record DashboardSummaryResponse
{
  /*===========================================================
    NetWorth:
    => Contains cash, credit-card debt, and calculated net worth.
  ===========================================================*/
  public NetWorthSummaryResponse NetWorth { get; set; } =
    new();

  /*===========================================================
    CashFlow:
    => Contains planned income, actual income, expenses,
       net cash flow, and zero-based budgeting information.
  ===========================================================*/
  public CashFlowSummaryResponse CashFlow { get; set; } =
    new();

  /*===========================================================
    Spending:
    => Contains Fixed and Variable planned-versus-actual totals.
  ===========================================================*/
  public SpendingSummaryResponse Spending { get; set; } =
    new();

  /*===========================================================
    Savings:
    => Contains planned savings and savings categories.
  ===========================================================*/
  public SavingsSummaryResponse Savings { get; set; } =
    new();

  /*===========================================================
    Bills:
    => Contains bill totals, payment status, and upcoming bills.
  ===========================================================*/
  public BillSummaryResponse Bills { get; set; } =
    new();

  /*===========================================================
    Accounts:
    => Contains all current financial accounts and balances.
  ===========================================================*/
  public List<FinancialAccountResponse> Accounts { get; set; } =
    [];

  /*===========================================================
    RecentTransactions:
    => Contains the most recent dashboard transactions.
  ===========================================================*/
  public List<TransactionResponse> RecentTransactions { get; set; } =
    [];
}