using MongoDB.Driver;
using TaskManager.Api.Features.Budget.DTOs;
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