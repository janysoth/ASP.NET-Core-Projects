using MongoDB.Driver;
using TaskManager.Api.Features.Budget.DTOs;

namespace TaskManager.Api.Features.Budget.Services;

/*===========================================================
  BudgetAdminService
-------------------------------------------------------------
  Purpose:
    => Provides administrative operations for the Budget module.

  Why:
    => Keeps cleanup logic separate from normal budgeting logic.

  Responsibilities:
    => Delete all budget-related data for the current user.
    => Return a summary of deleted records.

  Inherits:
    => BudgetBaseService
===========================================================*/
public class BudgetAdminService : BudgetBaseService
{
  /*===========================================================
    BudgetAdminService Constructor
  -------------------------------------------------------------
    Purpose:
      => Creates an instance of BudgetAdminService.

    Why:
      => Receives the MongoDB database through dependency
         injection and passes it to BudgetBaseService.

    Parameters:
      => database
         MongoDB database connection provided by Program.cs.

    Process Overview:
      1. Receive IMongoDatabase.
      2. Pass database to BudgetBaseService.
      3. BudgetBaseService initializes shared collections.

    Concepts Used:
      ✓ Dependency Injection
      ✓ Constructor Chaining
      ✓ Inheritance
  ===========================================================*/
  public BudgetAdminService(IMongoDatabase database)
    : base(database)
  {
  }

  /*===========================================================
    DeleteAllBudgetDataAsync
  -------------------------------------------------------------
    Purpose:
      => Deletes every budget-related record that belongs to
         the current user.

    Why:
      => Allows the user to completely reset their budget data
         and start over with a clean slate.

    Parameters:
      => userId
         The unique identifier of the logged-in user.

    Returns:
      => CleanSlateResponse

         Contains the number of deleted documents from each
         budget-related MongoDB collection.

    Business Rules:
      => Only deletes records owned by the current user.
      => Does not affect budget data belonging to other users.
      => Removes all budget months, categories, income records,
         expense records, financial accounts, and transfers.

    MongoDB Operations:
      => DeleteManyAsync(AccountTransfers)
      => DeleteManyAsync(FinancialAccounts)
      => DeleteManyAsync(BudgetCategories)
      => DeleteManyAsync(IncomeRecords)
      => DeleteManyAsync(ExpenseRecords)
      => DeleteManyAsync(BudgetMonths)

    Process Overview:
      1. Delete all account transfers.
      2. Delete all financial accounts.
      3. Delete all budget categories.
      4. Delete all income records.
      5. Delete all expense records.
      6. Delete all budget months.
      7. Return a deletion summary.

    Concepts Used:
      ✓ Async / Await
      ✓ MongoDB Driver
      ✓ DeleteManyAsync()
      ✓ Lambda Expressions
      ✓ DTO Pattern
      ✓ Object Initializer
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