using MongoDB.Driver;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

/*===========================================================
  BudgetBaseService
-------------------------------------------------------------
  Purpose:
    => Provides shared MongoDB collection access for all
       Budget service classes.

  Why:
    => Prevents repeating the same MongoDB setup code in every
       smaller budget service.

  Responsibilities:
    => Store budget-related MongoDB collection references.
    => Provide shared validation helper methods.
    => Allow child services to reuse common database logic.

  Inherited By:
    => BudgetAdminService
    => BudgetMonthService
    => BudgetCategoryService
    => IncomeService
    => ExpenseService
    => FinancialAccountService
    => AccountTransferService
===========================================================*/
public abstract class BudgetBaseService
{
  /*===========================================================
    MongoDB Collection References
  -------------------------------------------------------------
    Purpose:
      => Stores strongly typed MongoDB collection connections.

    Why:
      => Child services can use these protected collections
         without creating them again.

    Access Level:
      => protected means only this class and inherited services
         can access them.
  ===========================================================*/
  protected readonly IMongoCollection<BudgetMonth> BudgetMonths;
  protected readonly IMongoCollection<BudgetCategory> BudgetCategories;
  protected readonly IMongoCollection<IncomeRecord> IncomeRecords;
  protected readonly IMongoCollection<ExpenseRecord> ExpenseRecords;
  protected readonly IMongoCollection<FinancialAccount> FinancialAccounts;
  protected readonly IMongoCollection<AccountTransfer> AccountTransfers;

  /*===========================================================
    BudgetBaseService Constructor
  -------------------------------------------------------------
    Purpose:
      => Creates the shared MongoDB collection references.

    Why:
      => Receives the MongoDB database through dependency
         injection and connects each property to its collection.

    Parameters:
      => database
         MongoDB database connection provided by Program.cs.

    Process Overview:
      1. Receive IMongoDatabase.
      2. Connect BudgetMonths collection.
      3. Connect BudgetCategories collection.
      4. Connect IncomeRecords collection.
      5. Connect ExpenseRecords collection.
      6. Connect FinancialAccounts collection.
      7. Connect AccountTransfers collection.

    Concepts Used:
      ✓ Dependency Injection
      ✓ Inheritance
      ✓ MongoDB Driver
      ✓ Protected Members
      ✓ Constructor Initialization
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
  -------------------------------------------------------------
    Purpose:
      => Checks whether a budget month exists for the current user.

    Why:
      => Prevents child services from creating, updating, or
         deleting records connected to an invalid budget month.

    Parameters:
      => budgetMonthId
         The budget month id being checked.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => bool

         true if the budget month exists and belongs to the user.
         false if the budget month does not exist or belongs to
         another user.

    Business Rules:
      => A budget month must belong to the current user.
      => Users cannot access another user's budget month.
      => Related records should only be created after the parent
         budget month has been verified.

    MongoDB Operations:
      => Find(BudgetMonths)
      => FirstOrDefaultAsync()

    Process Overview:
      1. Search BudgetMonths using budgetMonthId and userId.
      2. Store the matching budget month if found.
      3. Return true when a matching record exists.
      4. Return false when no matching record exists.

    Concepts Used:
      ✓ Async / Await
      ✓ MongoDB Driver
      ✓ Find()
      ✓ FirstOrDefaultAsync()
      ✓ Lambda Expressions
      ✓ Boolean Return
      ✓ Ownership Validation
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
  -------------------------------------------------------------
    Purpose:
      => Checks whether a financial account exists for the
         current user.

    Why:
      => Prevents child services from using an invalid account
         or another user's account.

    Parameters:
      => accountId
         The financial account id being checked.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => bool

         true if the account exists and belongs to the user.
         false if the account does not exist or belongs to
         another user.

    Business Rules:
      => A financial account must belong to the current user.
      => Users cannot use another user's financial account.
      => Income, expense, or transfer records should only be
         connected to verified accounts.

    MongoDB Operations:
      => Find(FinancialAccounts)
      => FirstOrDefaultAsync()

    Process Overview:
      1. Search FinancialAccounts using accountId and userId.
      2. Store the matching account if found.
      3. Return true when a matching account exists.
      4. Return false when no matching account exists.

    Concepts Used:
      ✓ Async / Await
      ✓ MongoDB Driver
      ✓ Find()
      ✓ FirstOrDefaultAsync()
      ✓ Lambda Expressions
      ✓ Boolean Return
      ✓ Ownership Validation
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