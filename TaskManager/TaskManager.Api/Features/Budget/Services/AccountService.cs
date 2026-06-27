using MongoDB.Driver;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Mappers;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

/*===========================================================
  AccountService
-------------------------------------------------------------
  Purpose:
    => Manages financial account records for the Budget module.

  Why:
    => Keeps account-related business logic separate from
       budget month, category, income, expense, and transfer logic.

  Responsibilities:
    => Get all financial accounts for the current user.
    => Create new financial accounts.
    => Update existing financial accounts.
    => Delete financial accounts.
    => Calculate current account balances.

  Inherits:
    => BudgetBaseService
===========================================================*/
public class AccountService : BudgetBaseService
{
  /*===========================================================
    AccountService Constructor
  -------------------------------------------------------------
    Purpose:
      => Creates an instance of AccountService.

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
  public AccountService(IMongoDatabase database)
    : base(database)
  {
  }

  /*===========================================================
    GetAccountsAsync
  -------------------------------------------------------------
    Purpose:
      => Retrieves all financial accounts that belong to the
         current user.

    Why:
      => Allows the frontend to show the user's account list
         with calculated current balances.

    Parameters:
      => userId
         The unique identifier of the logged-in user.

    Returns:
      => List<FinancialAccountResponse>

         A list of financial account responses with current
         balances calculated from income, expenses, and transfers.

    Business Rules:
      => Only returns financial accounts owned by the current user.
      => Accounts are sorted alphabetically by name.
      => Each account response includes its calculated balance.

    MongoDB Operations:
      => Find(FinancialAccounts)
      => SortBy(Name)
      => ToListAsync()
      => Find(IncomeRecords)
      => Find(ExpenseRecords)
      => Find(AccountTransfers)

    Process Overview:
      1. Find all accounts for the current user.
      2. Sort accounts by name.
      3. Build a complete response for each account.
      4. Return the response list.

    Concepts Used:
      ✓ Async / Await
      ✓ MongoDB Driver
      ✓ Find()
      ✓ Sorting
      ✓ foreach Loop
      ✓ DTO Pattern
      ✓ Ownership Filtering
  ===========================================================*/
  public async Task<List<FinancialAccountResponse>> GetAccountsAsync(
    string userId)
  {
    /*---------------------------------------------------------
      Get user's financial accounts from MongoDB
    ---------------------------------------------------------*/

    var accounts = await FinancialAccounts
      .Find(a => a.UserId == userId)
      .SortBy(a => a.Name)
      .ToListAsync();

    /*---------------------------------------------------------
      Build complete account responses
    ---------------------------------------------------------*/

    var responses = new List<FinancialAccountResponse>();

    foreach (var account in accounts)
    {
      responses.Add(await BuildFinancialAccountResponseAsync(account));
    }

    return responses;
  }

  /*===========================================================
    CreateAccountAsync
  -------------------------------------------------------------
    Purpose:
      => Creates a new financial account for the current user.

    Why:
      => Allows the user to track balances for checking,
         savings, cash, credit card, or other account types.

    Parameters:
      => request
         Data sent from the frontend to create the account.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => FinancialAccountResponse

         The newly created account response with calculated
         current balance.

    Business Rules:
      => New account belongs to the current user.
      => CreatedAtUtc is set by the backend.
      => Current balance is calculated after creation.

    MongoDB Operations:
      => InsertOneAsync(FinancialAccounts)
      => Find(IncomeRecords)
      => Find(ExpenseRecords)
      => Find(AccountTransfers)

    Process Overview:
      1. Create a new FinancialAccount model.
      2. Copy values from the request.
      3. Attach the current user's id.
      4. Set CreatedAtUtc.
      5. Save the account to MongoDB.
      6. Build and return the response.

    Concepts Used:
      ✓ Async / Await
      ✓ MongoDB Driver
      ✓ InsertOneAsync()
      ✓ DTO Pattern
      ✓ Object Initializer
      ✓ DateTime.UtcNow
      ✓ Mapping
  ===========================================================*/
  public async Task<FinancialAccountResponse> CreateAccountAsync(
    CreateFinancialAccountRequest request,
    string userId)
  {
    /*---------------------------------------------------------
      Create new account model
    ---------------------------------------------------------*/

    var account = new FinancialAccount
    {
      UserId = userId,
      Name = request.Name,
      Type = request.Type,
      StartingBalance = request.StartingBalance,
      CreatedAtUtc = DateTime.UtcNow
    };

    /*---------------------------------------------------------
      Save account to MongoDB
    ---------------------------------------------------------*/

    await FinancialAccounts.InsertOneAsync(account);

    /*---------------------------------------------------------
      Build and return response
    ---------------------------------------------------------*/

    return await BuildFinancialAccountResponseAsync(account);
  }

  /*===========================================================
    UpdateAccountAsync
  -------------------------------------------------------------
    Purpose:
      => Updates an existing financial account.

    Why:
      => Allows the user to rename an account, change its type,
         or adjust its starting balance.

    Parameters:
      => accountId
         The financial account id being updated.

      => request
         Data sent from the frontend with updated account values.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => FinancialAccountResponse?

         The updated account response if successful.
         null if the account does not exist or does not belong
         to the current user.

    Business Rules:
      => User can only update their own financial account.
      => Name, Type, and StartingBalance are updated by this method.
      => Current balance is recalculated after the update.

    MongoDB Operations:
      => Builders<FinancialAccount>.Update
      => UpdateOneAsync(FinancialAccounts)
      => Find(FinancialAccounts)
      => FirstOrDefaultAsync()
      => Find(IncomeRecords)
      => Find(ExpenseRecords)
      => Find(AccountTransfers)

    Validation:
      => Uses accountId and userId in the update filter to
         verify account ownership.
      => Returns null if MongoDB does not match any document.

    Process Overview:
      1. Build the MongoDB update definition.
      2. Update the matching account by accountId and userId.
      3. Return null if no account was matched.
      4. Reload the updated account.
      5. Return null if the account cannot be found.
      6. Build and return the updated account response.

    Concepts Used:
      ✓ Async / Await
      ✓ MongoDB Driver
      ✓ Update Definition
      ✓ UpdateOneAsync()
      ✓ MatchedCount
      ✓ FirstOrDefaultAsync()
      ✓ DTO Pattern
      ✓ Mapper Pattern
      ✓ Ownership Validation
  ===========================================================*/
  public async Task<FinancialAccountResponse?> UpdateAccountAsync(
    string accountId,
    UpdateFinancialAccountRequest request,
    string userId)
  {
    /*---------------------------------------------------------
      Build update definition
    ---------------------------------------------------------*/

    var update = Builders<FinancialAccount>.Update
      .Set(a => a.Name, request.Name)
      .Set(a => a.Type, request.Type)
      .Set(a => a.StartingBalance, request.StartingBalance);

    /*---------------------------------------------------------
      Update account in MongoDB
    ---------------------------------------------------------*/

    var result = await FinancialAccounts.UpdateOneAsync(
      a => a.Id == accountId && a.UserId == userId,
      update);

    if (result.MatchedCount == 0)
    {
      return null;
    }

    /*---------------------------------------------------------
      Reload and return updated account
    ---------------------------------------------------------*/

    var account = await FinancialAccounts
      .Find(a => a.Id == accountId && a.UserId == userId)
      .FirstOrDefaultAsync();

    return account == null
      ? null
      : await BuildFinancialAccountResponseAsync(account);
  }

  /*===========================================================
    DeleteAccountAsync
  -------------------------------------------------------------
    Purpose:
      => Deletes an existing financial account.

    Why:
      => Allows the user to remove an account they no longer
         want to track.

    Parameters:
      => accountId
         The financial account id being deleted.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => FinancialAccountResponse?

         The deleted account response if successful.
         null if the account does not exist or does not belong
         to the current user.

    Business Rules:
      => User can only delete their own financial account.
      => The account response is built before deletion.
      => This method deletes the account only.
      => Related income, expenses, or transfers are not deleted
         by this method.

    MongoDB Operations:
      => Find(FinancialAccounts)
      => FirstOrDefaultAsync()
      => Find(IncomeRecords)
      => Find(ExpenseRecords)
      => Find(AccountTransfers)
      => DeleteOneAsync(FinancialAccounts)

    Validation:
      => Searches by accountId and userId before deleting.
      => Returns null if the account is not found.

    Process Overview:
      1. Find the account by accountId and userId.
      2. Return null if the account is not found.
      3. Build the account response before deletion.
      4. Delete the account from MongoDB.
      5. Return the deleted account response.

    Concepts Used:
      ✓ Async / Await
      ✓ MongoDB Driver
      ✓ Find()
      ✓ FirstOrDefaultAsync()
      ✓ DeleteOneAsync()
      ✓ DTO Pattern
      ✓ Mapper Pattern
      ✓ Guard Clause
      ✓ Ownership Validation
  ===========================================================*/
  public async Task<FinancialAccountResponse?> DeleteAccountAsync(
    string accountId,
    string userId)
  {
    /*---------------------------------------------------------
      Find account before deleting
    ---------------------------------------------------------*/

    var account = await FinancialAccounts
      .Find(a => a.Id == accountId && a.UserId == userId)
      .FirstOrDefaultAsync();

    if (account == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Build response before account is removed
    ---------------------------------------------------------*/

    var deletedAccount = await BuildFinancialAccountResponseAsync(account);

    /*---------------------------------------------------------
      Delete account from MongoDB
    ---------------------------------------------------------*/

    await FinancialAccounts.DeleteOneAsync(
      a => a.Id == accountId && a.UserId == userId);

    return deletedAccount;
  }

  /*===========================================================
    BuildFinancialAccountResponseAsync
  -------------------------------------------------------------
    Purpose:
      => Builds a complete FinancialAccountResponse from a
         FinancialAccount model.

    Why:
      => Centralizes account balance calculation so every method
         returns account data the same way.

    Parameters:
      => account
         The financial account model used to build the response.

    Returns:
      => FinancialAccountResponse

         A financial account response with the calculated
         current balance.

    Business Rules:
      => Only includes records owned by the same user.
      => Income increases normal account balances.
      => Expenses decrease normal account balances.
      => Transfers out decrease normal account balances.
      => Transfers in increase normal account balances.
      => Credit card balances are calculated differently because
         expenses increase the amount owed.
      => Credit card payments are treated as transfers in that
         reduce the amount owed.

    MongoDB Operations:
      => Find(IncomeRecords)
      => ToListAsync()
      => Find(ExpenseRecords)
      => ToListAsync()
      => Find(AccountTransfers FromAccountId)
      => ToListAsync()
      => Find(AccountTransfers ToAccountId)
      => ToListAsync()

    Used By:
      => GetAccountsAsync()
      => CreateAccountAsync()
      => UpdateAccountAsync()
      => DeleteAccountAsync()

    Process Overview:
      1. Get income records connected to the account.
      2. Get expense records connected to the account.
      3. Get transfers going out of the account.
      4. Get transfers coming into the account.
      5. Check whether the account is a credit card.
      6. Calculate current balance using the correct formula.
      7. Map and return the account response.

    Concepts Used:
      ✓ Async / Await
      ✓ MongoDB Driver
      ✓ Find()
      ✓ ToListAsync()
      ✓ LINQ
      ✓ Sum()
      ✓ Conditional Logic
      ✓ Case-Insensitive Comparison
      ✓ Mapper Pattern
      ✓ DTO Pattern
      ✓ Calculated Properties
  ===========================================================*/
  private async Task<FinancialAccountResponse> BuildFinancialAccountResponseAsync(
    FinancialAccount account)
  {
    /*---------------------------------------------------------
      Get records connected to this account
    ---------------------------------------------------------*/

    var incomes = await IncomeRecords
      .Find(i => i.AccountId == account.Id && i.UserId == account.UserId)
      .ToListAsync();

    var expenses = await ExpenseRecords
      .Find(e => e.AccountId == account.Id && e.UserId == account.UserId)
      .ToListAsync();

    var transfersOut = await AccountTransfers
      .Find(t => t.FromAccountId == account.Id && t.UserId == account.UserId)
      .ToListAsync();

    var transfersIn = await AccountTransfers
      .Find(t => t.ToAccountId == account.Id && t.UserId == account.UserId)
      .ToListAsync();

    /*---------------------------------------------------------
      Calculate current account balance
    ---------------------------------------------------------*/

    decimal currentBalance;

    if (account.Type.Equals("CreditCard", StringComparison.OrdinalIgnoreCase))
    {
      currentBalance =
        account.StartingBalance
        + expenses.Sum(e => e.Amount)
        - transfersIn.Sum(t => t.Amount)
        + transfersOut.Sum(t => t.Amount);
    }
    else
    {
      currentBalance =
        account.StartingBalance
        + incomes.Sum(i => i.Amount)
        - expenses.Sum(e => e.Amount)
        - transfersOut.Sum(t => t.Amount)
        + transfersIn.Sum(t => t.Amount);
    }

    /*---------------------------------------------------------
      Map and return response
    ---------------------------------------------------------*/

    return AccountMapper.ToResponse(account, currentBalance);
  }
}