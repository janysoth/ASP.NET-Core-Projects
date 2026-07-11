using MongoDB.Driver;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

// Service responsible for combining income, expenses,
// and account transfers into one transaction list.
public class TransactionService : BudgetBaseService
{
  // Constructor used for Dependency Injection (DI)
  public TransactionService(IMongoDatabase database) : base(database)
  {
  }

  // Gets all transactions for the current user.
  // The results can optionally be filtered by month,
  // year, or both using each record's transaction date.
  public async Task<List<TransactionResponse>> GetTransactionsAsync(
    string userId,
    int? month,
    int? year)
  {
    // Get all financial accounts that belong
    // to the current user.
    var accounts = await FinancialAccounts
      .Find(a => a.UserId == userId)
      .ToListAsync();

    // Create a lookup dictionary that connects
    // each account ID to its account name.
    //
    // Example:
    // "account-id-1" -> "Checking"
    // "account-id-2" -> "Savings"
    var accountLookup = accounts.ToDictionary(
      a => a.Id,
      a => a.Name);

    // Build the income filter.
    // Always restrict results to the current user.
    var incomeFilter = Builders<IncomeRecord>.Filter.Eq(
      i => i.UserId,
      userId);

    // Filter income records by transaction month
    // if a month was provided.
    if (month.HasValue)
    {
      incomeFilter &= Builders<IncomeRecord>.Filter.Where(
        i => i.IncomeDate.Month == month.Value);
    }

    // Filter income records by transaction year
    // if a year was provided.
    if (year.HasValue)
    {
      incomeFilter &= Builders<IncomeRecord>.Filter.Where(
        i => i.IncomeDate.Year == year.Value);
    }

    // Get income records matching the completed filter.
    var incomes = await IncomeRecords
      .Find(incomeFilter)
      .ToListAsync();

    // Build the expense filter.
    // Always restrict results to the current user.
    var expenseFilter = Builders<ExpenseRecord>.Filter.Eq(
      e => e.UserId,
      userId);

    // Filter expense records by transaction month
    // if a month was provided.
    if (month.HasValue)
    {
      expenseFilter &= Builders<ExpenseRecord>.Filter.Where(
        e => e.ExpenseDate.Month == month.Value);
    }

    // Filter expense records by transaction year
    // if a year was provided.
    if (year.HasValue)
    {
      expenseFilter &= Builders<ExpenseRecord>.Filter.Where(
        e => e.ExpenseDate.Year == year.Value);
    }

    // Get expense records matching the completed filter.
    var expenses = await ExpenseRecords
      .Find(expenseFilter)
      .ToListAsync();

    // Build the transfer filter.
    // Always restrict results to the current user.
    var transferFilter = Builders<AccountTransfer>.Filter.Eq(
      t => t.UserId,
      userId);

    // Filter transfers by transaction month
    // if a month was provided.
    if (month.HasValue)
    {
      transferFilter &= Builders<AccountTransfer>.Filter.Where(
        t => t.TransferDate.Month == month.Value);
    }

    // Filter transfers by transaction year
    // if a year was provided.
    if (year.HasValue)
    {
      transferFilter &= Builders<AccountTransfer>.Filter.Where(
        t => t.TransferDate.Year == year.Value);
    }

    // Get transfers matching the completed filter.
    var transfers = await AccountTransfers
      .Find(transferFilter)
      .ToListAsync();

    // Create one combined list that will hold
    // income, expense, and transfer transactions.
    var transactions = new List<TransactionResponse>();

    // Convert each income record into a common
    // TransactionResponse object.
    transactions.AddRange(incomes.Select(i => new TransactionResponse
    {
      // Copy the income record ID
      Id = i.Id,

      // Identify this transaction as income
      Type = "Income",

      // Use the income source as the title
      Title = i.Source,

      // Copy the income amount
      Amount = i.Amount,

      // Use the date the income was received
      TransactionDate = i.IncomeDate,

      // Copy the account where the income was deposited
      AccountId = i.AccountId,

      // Get the account name from the lookup dictionary.
      // Use an empty string if the account cannot be found.
      AccountName = accountLookup.GetValueOrDefault(
        i.AccountId,
        string.Empty),

      // Keep the budget month relationship for display
      // or navigation, but do not use it for date filtering.
      BudgetMonthId = i.BudgetMonthId,

      // Copy any optional notes
      Notes = i.Notes,

      // Copy when the record was created
      CreatedAtUtc = i.CreatedAtUtc
    }));

    // Convert each expense record into a common
    // TransactionResponse object.
    transactions.AddRange(expenses.Select(e => new TransactionResponse
    {
      // Copy the expense record ID
      Id = e.Id,

      // Identify this transaction as an expense
      Type = "Expense",

      // Use the expense name as the title
      Title = e.Name,

      // Copy the expense category
      Category = e.Category,

      // Copy the expense amount
      Amount = e.Amount,

      // Use the date the expense occurred
      TransactionDate = e.ExpenseDate,

      // Copy the account used for the expense
      AccountId = e.AccountId,

      // Get the account name from the lookup dictionary.
      // Use an empty string if the account cannot be found.
      AccountName = accountLookup.GetValueOrDefault(
        e.AccountId,
        string.Empty),

      // Keep the budget month relationship for display
      // or navigation, but do not use it for date filtering.
      BudgetMonthId = e.BudgetMonthId,

      // Copy any optional notes
      Notes = e.Notes,

      // Copy when the record was created
      CreatedAtUtc = e.CreatedAtUtc
    }));

    // Convert each transfer into a common
    // TransactionResponse object.
    transactions.AddRange(transfers.Select(t => new TransactionResponse
    {
      // Copy the transfer record ID
      Id = t.Id,

      // Identify this transaction as a transfer
      Type = "Transfer",

      // Use a standard title for transfers
      Title = "Account Transfer",

      // Copy the transfer amount
      Amount = t.Amount,

      // Use the date the transfer occurred
      TransactionDate = t.TransferDate,

      // Copy the source account ID
      FromAccountId = t.FromAccountId,

      // Get the source account name
      FromAccountName = accountLookup.GetValueOrDefault(
        t.FromAccountId,
        string.Empty),

      // Copy the destination account ID
      ToAccountId = t.ToAccountId,

      // Get the destination account name
      ToAccountName = accountLookup.GetValueOrDefault(
        t.ToAccountId,
        string.Empty),

      // Copy any optional notes
      Notes = t.Notes,

      // Copy when the record was created
      CreatedAtUtc = t.CreatedAtUtc
    }));

    // Sort all transactions by transaction date,
    // with the newest transactions first.
    //
    // If two transactions have the same transaction date,
    // sort them by creation date.
    return transactions
      .OrderByDescending(t => t.TransactionDate)
      .ThenByDescending(t => t.CreatedAtUtc)
      .ToList();
  }
}