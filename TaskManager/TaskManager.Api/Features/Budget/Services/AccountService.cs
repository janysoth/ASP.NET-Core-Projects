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
    BuildFinancialAccountResponseAsync:
    => Calculates the current balance for one account.
    => Includes income, expenses, transfers in, and transfers out.
    => Uses different balance rules for cash and credit-card accounts.
  ===========================================================*/
  private async Task<FinancialAccountResponse>
    BuildFinancialAccountResponseAsync(
      FinancialAccount account)
  {
    /*
      Use the beginning of tomorrow as the cutoff.

      This includes:
      - past transactions;
      - every transaction dated today.

      It excludes:
      - future-dated transactions.
    */
    var transactionCutoffUtc =
      DateTime.UtcNow.Date.AddDays(1);

    /*---------------------------------------------------------
      Load income records posted through today.
    ---------------------------------------------------------*/
    var incomes = await IncomeRecords
      .Find(income =>
        income.UserId == account.UserId &&
        income.AccountId == account.Id &&
        income.IncomeDate < transactionCutoffUtc)
      .ToListAsync();

    /*---------------------------------------------------------
      Load expense records posted through today.
    ---------------------------------------------------------*/
    var expenses = await ExpenseRecords
      .Find(expense =>
        expense.UserId == account.UserId &&
        expense.AccountId == account.Id &&
        expense.ExpenseDate < transactionCutoffUtc)
      .ToListAsync();

    /*---------------------------------------------------------
      Load all posted transfers for the user.

      We filter incoming and outgoing transfers in memory.
      This avoids separate MongoDB field queries returning
      inconsistent results with older transfer documents.
    ---------------------------------------------------------*/
    var userTransfers = await AccountTransfers
      .Find(transfer =>
        transfer.UserId == account.UserId &&
        transfer.TransferDate < transactionCutoffUtc)
      .ToListAsync();

    var transfersOut = userTransfers
      .Where(transfer =>
        string.Equals(
          transfer.FromAccountId,
          account.Id,
          StringComparison.Ordinal))
      .ToList();

    var transfersIn = userTransfers
      .Where(transfer =>
        string.Equals(
          transfer.ToAccountId,
          account.Id,
          StringComparison.Ordinal))
      .ToList();

    /*---------------------------------------------------------
      Calculate totals separately for readability.
    ---------------------------------------------------------*/
    var totalIncome =
      incomes.Sum(income =>
        income.Amount);

    var totalExpenses =
      expenses.Sum(expense =>
        expense.Amount);

    var totalTransfersOut =
      transfersOut.Sum(transfer =>
        transfer.Amount);

    var totalTransfersIn =
      transfersIn.Sum(transfer =>
        transfer.Amount);

    decimal currentBalance;

    /*---------------------------------------------------------
      Credit-card balance:

      Starting debt
      + purchases
      + transfers out
      - payments received

      A transfer into a credit card represents a payment,
      so it reduces the balance owed.
    ---------------------------------------------------------*/
    if (string.Equals(
      account.Type,
      FinancialAccountTypes.CreditCard,
      StringComparison.OrdinalIgnoreCase))
    {
      currentBalance =
        account.StartingBalance
        + totalExpenses
        + totalTransfersOut
        - totalTransfersIn;
    }
    else
    {
      /*-------------------------------------------------------
        Checking/Savings balance:

        Starting balance
        + income
        + transfers received
        - expenses
        - transfers sent
      -------------------------------------------------------*/
      currentBalance =
        account.StartingBalance
        + totalIncome
        + totalTransfersIn
        - totalExpenses
        - totalTransfersOut;
    }

    return AccountMapper.ToResponse(
      account,
      currentBalance);
  }
}