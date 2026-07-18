using MongoDB.Driver;
using TaskManager.Api.Features.Budget.Mappers;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

public class AccountService : BudgetBaseService
{
  /*===========================================================
    AccountService Constructor
  ===========================================================*/
  public AccountService(IMongoDatabase database)
    : base(database)
  {
  }

  /*===========================================================
    GetAccountsAsync
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
  ===========================================================*/
  public async Task<FinancialAccountResponse?> DeleteAccountAsync(
    string accountId,
    string userId)
  {
    /*---------------------------------------------------------
      Find the account and make sure it belongs
      to the current user.
    ---------------------------------------------------------*/
    var account = await FinancialAccounts
      .Find(a => a.Id == accountId && a.UserId == userId)
      .FirstOrDefaultAsync();


    /*---------------------------------------------------------
      Return null if the account does not exist
    ---------------------------------------------------------*/
    if (account == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Check if this account is used by any income records
    ---------------------------------------------------------*/
    var incomeCount = await IncomeRecords.CountDocumentsAsync(
      i => i.AccountId == accountId && i.UserId == userId);

    /*---------------------------------------------------------
      Check if this account is used by any expense records
    ---------------------------------------------------------*/
    var expenseCount = await ExpenseRecords.CountDocumentsAsync(
      e => e.AccountId == accountId && e.UserId == userId);

    /*---------------------------------------------------------
      Check if this account is used in any transfers,
      either as the source account or destination account
    ---------------------------------------------------------*/
    var transferCount = await AccountTransfers.CountDocumentsAsync(
      t =>
        t.UserId == userId &&
        (t.FromAccountId == accountId || t.ToAccountId == accountId));

    /*---------------------------------------------------------      
      Prevent deleting the account if it is still
      referenced by income, expenses, or transfers
    ---------------------------------------------------------*/
    if (incomeCount > 0 || expenseCount > 0 || transferCount > 0)
    {
      throw new InvalidOperationException(
        "This account cannot be deleted because it is used by income, expenses, or transfers.");
    }

    /*---------------------------------------------------------
      Build the response before deleting the account,
      since the account will no longer exist afterward
    ---------------------------------------------------------*/
    var deletedAccount = await BuildFinancialAccountResponseAsync(account);

    /*---------------------------------------------------------
      Delete the account from the database  
    ---------------------------------------------------------*/
    await FinancialAccounts.DeleteOneAsync(
      a => a.Id == accountId && a.UserId == userId);

    /*---------------------------------------------------------
      Return the deleted account information
    ---------------------------------------------------------*/
    return deletedAccount;
  }

  /*===========================================================
    BuildFinancialAccountResponseAsync
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

    if (string.Equals(
      account.Type,
      FinancialAccountTypes.CreditCard,
      StringComparison.OrdinalIgnoreCase))
    {
      currentBalance =
        account.StartingBalance
        + expenses.Sum(expense => expense.Amount)
        - transfersIn.Sum(transfer => transfer.Amount)
        + transfersOut.Sum(transfer => transfer.Amount);
    }
    else
    {
      currentBalance =
        account.StartingBalance
        + incomes.Sum(income => income.Amount)
        - expenses.Sum(expense => expense.Amount)
        - transfersOut.Sum(transfer => transfer.Amount)
        + transfersIn.Sum(transfer => transfer.Amount);
    }

    /*---------------------------------------------------------
      Map and return response
    ---------------------------------------------------------*/
    return AccountMapper.ToResponse(account, currentBalance);
  }
}