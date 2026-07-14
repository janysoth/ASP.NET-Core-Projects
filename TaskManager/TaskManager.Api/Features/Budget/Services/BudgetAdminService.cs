using MongoDB.Driver;
using TaskManager.Api.Features.Budget.DTOs;

namespace TaskManager.Api.Features.Budget.Services;

public class BudgetAdminService : BudgetBaseService
{
  /*===========================================================
   BudgetAdminService Constructor
 ===========================================================*/
  public BudgetAdminService(IMongoDatabase database) : base(database)
  {
  }

  /*===========================================================
    DeleteAllBudgetDataAsync:
    => Deletes all finance data owned by the logged-in user.
    => Includes bills along with accounts, budgets, and transactions.
    => Returns the deleted record counts.
  ===========================================================*/
  public async Task<CleanSlateResponse> DeleteAllBudgetDataAsync(
    string userId)
  {
    var deletedBills = await Bills.DeleteManyAsync(
      b => b.UserId == userId);

    var deletedTransfers = await AccountTransfers.DeleteManyAsync(
      t => t.UserId == userId);

    var deletedAccounts = await FinancialAccounts.DeleteManyAsync(
      a => a.UserId == userId);

    var deletedBudgetCategories = await BudgetCategories.DeleteManyAsync(
      c => c.UserId == userId);

    var deletedIncomeRecords = await IncomeRecords.DeleteManyAsync(
      i => i.UserId == userId);

    var deletedExpenseRecords = await ExpenseRecords.DeleteManyAsync(
      e => e.UserId == userId);

    var deletedBudgetMonths = await BudgetMonths.DeleteManyAsync(
      b => b.UserId == userId);

    return new CleanSlateResponse
    {
      DeletedAccounts = deletedAccounts.DeletedCount,
      DeletedTransfers = deletedTransfers.DeletedCount,
      DeletedBudgetMonths = deletedBudgetMonths.DeletedCount,
      DeletedBudgetCategories = deletedBudgetCategories.DeletedCount,
      DeletedIncomeRecords = deletedIncomeRecords.DeletedCount,
      DeletedExpenseRecords = deletedExpenseRecords.DeletedCount,
      DeletedBills = deletedBills.DeletedCount
    };
  }
}