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
  }

  /*===========================================================
    BudgetMonthExistsAsync
  ===========================================================*/
  protected async Task<bool> BudgetMonthExistsAsync(
    string budgetMonthId,
    string userId)
  {
    var budgetMonth = await BudgetMonths
      .Find(b => b.Id == budgetMonthId && b.UserId == userId)
      .FirstOrDefaultAsync();

    return budgetMonth != null;
  }

  /*===========================================================
    AccountExistsAsync
  ===========================================================*/
  protected async Task<bool> AccountExistsAsync(
    string accountId,
    string userId)
  {
    var account = await FinancialAccounts
      .Find(a => a.Id == accountId && a.UserId == userId)
      .FirstOrDefaultAsync();

    return account != null;
  }
}