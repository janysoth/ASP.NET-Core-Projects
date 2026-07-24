using MongoDB.Driver;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

// Service responsible for combining income, expenses,
// and account transfers into one transaction list.
public class TransactionService : BudgetBaseService
{
  // Constructor used for Dependency Injection (DI)
  public TransactionService(
    IMongoDatabase database) : base(database)
  {
  }

  /*===========================================================
    GetTransactionsAsync:
    => Gets income, expenses, and transfers for the user.
    => Can optionally filter by transaction month and year.
    => Resolves account names and expense category names.
    => Returns all transaction types in one combined list.
  ===========================================================*/
  public async Task<List<TransactionResponse>> GetTransactionsAsync(
    string userId,
    int? month,
    int? year)
  {
    /*---------------------------------------------------------
      Load all financial accounts owned by the current user.

      We load them once so we can resolve account IDs into
      readable account names without additional MongoDB queries.
    ---------------------------------------------------------*/
    var accounts = await FinancialAccounts
      .Find(account =>
        account.UserId == userId)
      .ToListAsync();

    /*---------------------------------------------------------
      Create an account-name lookup.

      Example:

      account-id-1 -> "Checking"
      account-id-2 -> "Savings"
      account-id-3 -> "Capital One"
    ---------------------------------------------------------*/
    var accountLookup = accounts.ToDictionary(
      account => account.Id,
      account => account.Name);

    /*---------------------------------------------------------
      Load all budget categories owned by the current user.

      ExpenseRecord now stores CategoryId instead of the
      category name.

      We therefore need the categories so we can convert:

      CategoryId -> CategoryName
    ---------------------------------------------------------*/
    var categories = await BudgetCategories
      .Find(category =>
        category.UserId == userId)
      .ToListAsync();

    /*---------------------------------------------------------
      Create a category-name lookup.

      Example:

      category-id-1 -> "Housing"
      category-id-2 -> "Groceries"
    ---------------------------------------------------------*/
    var categoryLookup = categories.ToDictionary(
      category => category.Id,
      category => category.Name);

    /*===========================================================
      INCOME
    ===========================================================*/

    // Always restrict income records to the current user.
    var incomeFilter =
      Builders<IncomeRecord>.Filter.Eq(
        income => income.UserId,
        userId);

    // Filter income by transaction month when provided.
    if (month.HasValue)
    {
      incomeFilter &=
        Builders<IncomeRecord>.Filter.Where(
          income =>
            income.IncomeDate.Month ==
            month.Value);
    }

    // Filter income by transaction year when provided.
    if (year.HasValue)
    {
      incomeFilter &=
        Builders<IncomeRecord>.Filter.Where(
          income =>
            income.IncomeDate.Year ==
            year.Value);
    }

    // Get matching income records.
    var incomes = await IncomeRecords
      .Find(incomeFilter)
      .ToListAsync();

    /*===========================================================
      EXPENSES
    ===========================================================*/

    // Always restrict expense records to the current user.
    var expenseFilter =
      Builders<ExpenseRecord>.Filter.Eq(
        expense => expense.UserId,
        userId);

    // Filter expenses by transaction month when provided.
    if (month.HasValue)
    {
      expenseFilter &=
        Builders<ExpenseRecord>.Filter.Where(
          expense =>
            expense.ExpenseDate.Month ==
            month.Value);
    }

    // Filter expenses by transaction year when provided.
    if (year.HasValue)
    {
      expenseFilter &=
        Builders<ExpenseRecord>.Filter.Where(
          expense =>
            expense.ExpenseDate.Year ==
            year.Value);
    }

    // Get matching expense records.
    var expenses = await ExpenseRecords
      .Find(expenseFilter)
      .ToListAsync();

    /*===========================================================
      TRANSFERS
    ===========================================================*/

    // Always restrict transfers to the current user.
    var transferFilter =
      Builders<AccountTransfer>.Filter.Eq(
        transfer => transfer.UserId,
        userId);

    // Filter transfers by transaction month when provided.
    if (month.HasValue)
    {
      transferFilter &=
        Builders<AccountTransfer>.Filter.Where(
          transfer =>
            transfer.TransferDate.Month ==
            month.Value);
    }

    // Filter transfers by transaction year when provided.
    if (year.HasValue)
    {
      transferFilter &=
        Builders<AccountTransfer>.Filter.Where(
          transfer =>
            transfer.TransferDate.Year ==
            year.Value);
    }

    // Get matching transfers.
    var transfers = await AccountTransfers
      .Find(transferFilter)
      .ToListAsync();

    /*===========================================================
      BUILD COMBINED TRANSACTION LIST
    ===========================================================*/

    var transactions =
      new List<TransactionResponse>();

    /*---------------------------------------------------------
      Convert income records into TransactionResponse objects.
    ---------------------------------------------------------*/
    transactions.AddRange(
      incomes.Select(income =>
        new TransactionResponse
        {
          Id =
            income.Id,

          Type =
            TransactionTypes.Income,

          Title =
            income.Source,

          Amount =
            income.Amount,

          TransactionDate =
            income.IncomeDate,

          AccountId =
            income.AccountId,

          AccountName =
            accountLookup.GetValueOrDefault(
              income.AccountId,
              string.Empty),

          BudgetMonthId =
            income.BudgetMonthId,

          Notes =
            income.Notes,

          CreatedAtUtc =
            income.CreatedAtUtc
        }));

    /*---------------------------------------------------------
      Convert expense records into TransactionResponse objects.

      ExpenseRecord stores:

        CategoryId

      TransactionResponse still displays:

        Category

      Therefore, we resolve the readable category name using
      the category lookup dictionary.
    ---------------------------------------------------------*/
    transactions.AddRange(
      expenses.Select(expense =>
        new TransactionResponse
        {
          Id =
            expense.Id,

          Type =
            TransactionTypes.Expense,

          Title =
            expense.Name,

          Category =
            categoryLookup.GetValueOrDefault(
              expense.CategoryId,
              "Unknown Category"),

          Amount =
            expense.Amount,

          TransactionDate =
            expense.ExpenseDate,

          AccountId =
            expense.AccountId,

          AccountName =
            accountLookup.GetValueOrDefault(
              expense.AccountId,
              string.Empty),

          BudgetMonthId =
            expense.BudgetMonthId,

          Notes =
            expense.Notes,

          CreatedAtUtc =
            expense.CreatedAtUtc
        }));

    /*---------------------------------------------------------
      Convert transfers into TransactionResponse objects.
    ---------------------------------------------------------*/
    transactions.AddRange(
      transfers.Select(transfer =>
        new TransactionResponse
        {
          Id =
            transfer.Id,

          Type =
            TransactionTypes.Transfer,

          Title =
            "Account Transfer",

          Amount =
            transfer.Amount,

          TransactionDate =
            transfer.TransferDate,

          FromAccountId =
            transfer.FromAccountId,

          FromAccountName =
            accountLookup.GetValueOrDefault(
              transfer.FromAccountId,
              string.Empty),

          ToAccountId =
            transfer.ToAccountId,

          ToAccountName =
            accountLookup.GetValueOrDefault(
              transfer.ToAccountId,
              string.Empty),

          Notes =
            transfer.Notes,

          CreatedAtUtc =
            transfer.CreatedAtUtc
        }));

    /*---------------------------------------------------------
      Sort all transaction types together.

      Newest transaction first.

      When two records have the same transaction date,
      CreatedAtUtc is used as the secondary sort.
    ---------------------------------------------------------*/
    return transactions
      .OrderByDescending(transaction =>
        transaction.TransactionDate)
      .ThenByDescending(transaction =>
        transaction.CreatedAtUtc)
      .ToList();
  }
}