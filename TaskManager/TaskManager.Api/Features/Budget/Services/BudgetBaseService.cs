using MongoDB.Driver;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

public abstract class BudgetBaseService
{
  protected readonly IMongoCollection<BudgetMonth> BudgetMonths;
  protected readonly IMongoCollection<BudgetCategory> BudgetCategories;
  protected readonly IMongoCollection<IncomeRecord> IncomeRecords;
  protected readonly IMongoCollection<ExpenseRecord> ExpenseRecords;
  protected readonly IMongoCollection<FinancialAccount> FinancialAccounts;
  protected readonly IMongoCollection<AccountTransfer> AccountTransfers;
  protected readonly IMongoCollection<Bill> Bills;
  protected readonly IMongoCollection<RecurringBillTemplate>
    RecurringBillTemplates;

  /*===========================================================
    BudgetBaseService Constructor
  ===========================================================*/
  protected BudgetBaseService(IMongoDatabase database)
  {
    BudgetMonths =
      database.GetCollection<BudgetMonth>("BudgetMonths");

    BudgetCategories =
      database.GetCollection<BudgetCategory>("BudgetCategories");

    IncomeRecords =
      database.GetCollection<IncomeRecord>("IncomeRecords");

    ExpenseRecords =
      database.GetCollection<ExpenseRecord>("ExpenseRecords");

    FinancialAccounts =
      database.GetCollection<FinancialAccount>("FinancialAccounts");

    AccountTransfers =
      database.GetCollection<AccountTransfer>("AccountTransfers");

    Bills =
      database.GetCollection<Bill>("Bills");

    RecurringBillTemplates =
      database.GetCollection<RecurringBillTemplate>(
        "RecurringBillTemplates");
  }

  /*===========================================================
    BudgetMonthExistsAsync:
    => Checks whether a budget month exists for the current user.
    => Prevents records from being attached to another user's
       budget month.
  ===========================================================*/
  protected async Task<bool> BudgetMonthExistsAsync(
    string budgetMonthId,
    string userId)
  {
    var count = await BudgetMonths.CountDocumentsAsync(
      budgetMonth =>
        budgetMonth.Id == budgetMonthId &&
        budgetMonth.UserId == userId);

    return count > 0;
  }

  /*===========================================================
    GetBudgetMonthModelByIdAsync:
    => Gets one BudgetMonth database model owned by the user.
    => Returns null when the budget month does not exist.
    => Named "Model" to distinguish it from service methods
       that return BudgetMonthResponse DTOs.
  ===========================================================*/
  protected async Task<BudgetMonth?> GetBudgetMonthModelByIdAsync(
    string budgetMonthId,
    string userId)
  {
    return await BudgetMonths
      .Find(budgetMonth =>
        budgetMonth.Id == budgetMonthId &&
        budgetMonth.UserId == userId)
      .FirstOrDefaultAsync();
  }

  /*===========================================================
    AccountExistsAsync:
    => Checks whether an account exists for the current user.
    => Used before recording income, expenses, or transfers.
  ===========================================================*/
  protected async Task<bool> AccountExistsAsync(
    string accountId,
    string userId)
  {
    var count = await FinancialAccounts.CountDocumentsAsync(
      account =>
        account.Id == accountId &&
        account.UserId == userId);

    return count > 0;
  }

  /*===========================================================
    GetAccountByIdAsync:
    => Gets one financial account owned by the current user.
    => Returns null when the account does not exist.
  ===========================================================*/
  protected async Task<FinancialAccount?> GetAccountByIdAsync(
    string accountId,
    string userId)
  {
    return await FinancialAccounts
      .Find(account =>
        account.Id == accountId &&
        account.UserId == userId)
      .FirstOrDefaultAsync();
  }

  /*===========================================================
    GetCategoryByIdAsync:
    => Gets one budget category owned by the current user.
    => Returns null when the category does not exist.
  ===========================================================*/
  protected async Task<BudgetCategory?> GetCategoryByIdAsync(
    string categoryId,
    string userId)
  {
    return await BudgetCategories
      .Find(category =>
        category.Id == categoryId &&
        category.UserId == userId)
      .FirstOrDefaultAsync();
  }

  /*===========================================================
    GetBudgetCategoryForMonthAsync:
    => Gets one category owned by the current user.
    => Confirms the category belongs to the selected budget
       month.
    => Returns null when the category is invalid or belongs to
       another budget month.
  ===========================================================*/
  protected async Task<BudgetCategory?>
    GetBudgetCategoryForMonthAsync(
      string categoryId,
      string budgetMonthId,
      string userId)
  {
    return await BudgetCategories
      .Find(category =>
        category.Id == categoryId &&
        category.BudgetMonthId == budgetMonthId &&
        category.UserId == userId)
      .FirstOrDefaultAsync();
  }

  /*===========================================================
    GetAccountCurrentBalanceAsync:
    => Calculates the current balance for one account.
    => Cash accounts treat expenses as money leaving.
    => Credit cards treat expenses as increasing the amount owed.
  ===========================================================*/
  protected async Task<decimal> GetAccountCurrentBalanceAsync(
    FinancialAccount account)
  {
    var incomes = await IncomeRecords
      .Find(income =>
        income.UserId == account.UserId &&
        income.AccountId == account.Id)
      .ToListAsync();

    var expenses = await ExpenseRecords
      .Find(expense =>
        expense.UserId == account.UserId &&
        expense.AccountId == account.Id)
      .ToListAsync();

    var transfersOut = await AccountTransfers
      .Find(transfer =>
        transfer.UserId == account.UserId &&
        transfer.FromAccountId == account.Id)
      .ToListAsync();

    var transfersIn = await AccountTransfers
      .Find(transfer =>
        transfer.UserId == account.UserId &&
        transfer.ToAccountId == account.Id)
      .ToListAsync();

    if (string.Equals(
      account.Type,
      FinancialAccountTypes.CreditCard,
      StringComparison.OrdinalIgnoreCase))
    {
      return
        account.StartingBalance
        + expenses.Sum(expense => expense.Amount)
        + transfersOut.Sum(transfer => transfer.Amount)
        - transfersIn.Sum(transfer => transfer.Amount);
    }

    return
      account.StartingBalance
      + incomes.Sum(income => income.Amount)
      - expenses.Sum(expense => expense.Amount)
      - transfersOut.Sum(transfer => transfer.Amount)
      + transfersIn.Sum(transfer => transfer.Amount);
  }
}