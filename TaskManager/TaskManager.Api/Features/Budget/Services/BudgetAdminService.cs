using MongoDB.Driver;
// using TaskManager.Api.Features.Budget.DTOs;

namespace TaskManager.Api.Features.Budget.Services;

public class BudgetAdminService : BudgetBaseService
{
  /*===========================================================
    BudgetAdminService Constructor
  ===========================================================*/
  public BudgetAdminService(IMongoDatabase database)
    : base(database)
  {
  }

  /*===========================================================
    DeleteAllBudgetDataAsync
  ===========================================================*/
  public async Task<CleanSlateResponse> DeleteAllBudgetDataAsync(
    string userId)
  {
    /*---------------------------------------------------------
      Delete account-related records
    ---------------------------------------------------------*/
    var deletedTransfers = await AccountTransfers.DeleteManyAsync(
      t => t.UserId == userId);

    var deletedAccounts = await FinancialAccounts.DeleteManyAsync(
      a => a.UserId == userId);

    /*---------------------------------------------------------
      Delete budget-related records
    ---------------------------------------------------------*/
    var deletedBudgetCategories = await BudgetCategories.DeleteManyAsync(
      c => c.UserId == userId);

    var deletedIncomeRecords = await IncomeRecords.DeleteManyAsync(
      i => i.UserId == userId);

    var deletedExpenseRecords = await ExpenseRecords.DeleteManyAsync(
      e => e.UserId == userId);

    var deletedBudgetMonths = await BudgetMonths.DeleteManyAsync(
      b => b.UserId == userId);

    /*---------------------------------------------------------
      Build and return response
    ---------------------------------------------------------*/
    return new CleanSlateResponse
    {
      DeletedAccounts = deletedAccounts.DeletedCount,
      DeletedTransfers = deletedTransfers.DeletedCount,
      DeletedBudgetMonths = deletedBudgetMonths.DeletedCount,
      DeletedBudgetCategories = deletedBudgetCategories.DeletedCount,
      DeletedIncomeRecords = deletedIncomeRecords.DeletedCount,
      DeletedExpenseRecords = deletedExpenseRecords.DeletedCount
    };
  }
}