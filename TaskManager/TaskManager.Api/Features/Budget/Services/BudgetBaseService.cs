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
    BudgetMonths = database.GetCollection<BudgetMonth>("BudgetMonths");
    BudgetCategories = database.GetCollection<BudgetCategory>("BudgetCategories");
    IncomeRecords = database.GetCollection<IncomeRecord>("IncomeRecords");
    ExpenseRecords = database.GetCollection<ExpenseRecord>("ExpenseRecords");
    FinancialAccounts = database.GetCollection<FinancialAccount>("FinancialAccounts");
    AccountTransfers = database.GetCollection<AccountTransfer>("AccountTransfers");
    Bills = database.GetCollection<Bill>("Bills");
    RecurringBillTemplates = database.GetCollection<RecurringBillTemplate>(
    "RecurringBillTemplates");
  }

  /*===========================================================
    BudgetMonthExistsAsync:
    => Checks whether a budget month exists for the current user.
    => Prevents records from being attached to another user's budget.
  ===========================================================*/
  protected async Task<bool> BudgetMonthExistsAsync(
    string budgetMonthId,
    string userId)
  {
    var count = await BudgetMonths.CountDocumentsAsync(
      b => b.Id == budgetMonthId && b.UserId == userId);

    return count > 0;
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
      a => a.Id == accountId && a.UserId == userId);

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
      .Find(a => a.Id == accountId && a.UserId == userId)
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
      .Find(c => c.Id == categoryId && c.UserId == userId)
      .FirstOrDefaultAsync();
  }
}