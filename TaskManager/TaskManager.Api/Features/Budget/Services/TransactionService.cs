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
    => Can optionally filter by:
       - Transaction month
       - Transaction year
       - Financial account type
       - Transaction type
    => Resolves account names and expense category names.
    => Returns all matching transaction types in one list.

    Supported account types:
    - Checking
    - Savings
    - CreditCard

    Supported transaction types:
    - Income
    - Expense
    - Transfer
  ===========================================================*/
  public async Task<List<TransactionResponse>>
    GetTransactionsAsync(
      string userId,
      int? month,
      int? year,
      string? accountType = null,
      string? transactionType = null)
  {
    /*---------------------------------------------------------
      Normalize the optional filters.

      This allows values such as:

      checking
      Checking
      CHECKING

      to behave the same way.
    ---------------------------------------------------------*/
    var normalizedAccountType =
      string.IsNullOrWhiteSpace(accountType)
        ? null
        : accountType.Trim();

    var normalizedTransactionType =
      string.IsNullOrWhiteSpace(transactionType)
        ? null
        : transactionType.Trim();

    /*---------------------------------------------------------
      Load all accounts owned by the current user
    ---------------------------------------------------------*/
    var accounts =
      await FinancialAccounts
        .Find(account =>
          account.UserId == userId)
        .ToListAsync();

    /*---------------------------------------------------------
      Create an account lookup.

      AccountId => FinancialAccount
    ---------------------------------------------------------*/
    var accountLookup =
      accounts.ToDictionary(
        account => account.Id,
        account => account);

    /*---------------------------------------------------------
      Find the IDs of accounts matching the accountType filter.

      When accountType is null, all account IDs are included.
    ---------------------------------------------------------*/
    var matchingAccountIds =
      accounts
        .Where(account =>
          normalizedAccountType is null ||
          string.Equals(
            account.Type,
            normalizedAccountType,
            StringComparison.OrdinalIgnoreCase))
        .Select(account => account.Id)
        .ToHashSet();

    /*---------------------------------------------------------
      When an account type was supplied but the user does not
      have any accounts of that type, no transactions can match.
    ---------------------------------------------------------*/
    if (normalizedAccountType is not null &&
        matchingAccountIds.Count == 0)
    {
      return [];
    }

    /*---------------------------------------------------------
      Load categories owned by the current user
    ---------------------------------------------------------*/
    var categories =
      await BudgetCategories
        .Find(category =>
          category.UserId == userId)
        .ToListAsync();

    var categoryLookup =
      categories.ToDictionary(
        category => category.Id,
        category => category.Name);

    /*---------------------------------------------------------
      Determine which transaction types should be loaded.

      When no transaction type is supplied, all three types
      are included.
    ---------------------------------------------------------*/
    var includeIncome =
      normalizedTransactionType is null ||
      string.Equals(
        normalizedTransactionType,
        TransactionTypes.Income,
        StringComparison.OrdinalIgnoreCase);

    var includeExpense =
      normalizedTransactionType is null ||
      string.Equals(
        normalizedTransactionType,
        TransactionTypes.Expense,
        StringComparison.OrdinalIgnoreCase);

    var includeTransfer =
      normalizedTransactionType is null ||
      string.Equals(
        normalizedTransactionType,
        TransactionTypes.Transfer,
        StringComparison.OrdinalIgnoreCase);

    /*===========================================================
      INCOME
    ===========================================================*/

    var incomes =
      new List<IncomeRecord>();

    if (includeIncome)
    {
      var incomeFilter =
        Builders<IncomeRecord>.Filter.Eq(
          income => income.UserId,
          userId);

      /*-------------------------------------------------------
        Filter by account type using the matching account IDs
      -------------------------------------------------------*/
      if (normalizedAccountType is not null)
      {
        incomeFilter &=
          Builders<IncomeRecord>.Filter.In(
            income => income.AccountId,
            matchingAccountIds);
      }

      /*-------------------------------------------------------
        Filter by month and year using a UTC date range
      -------------------------------------------------------*/
      if (month.HasValue)
      {
        var monthStart =
          new DateTime(
            year ?? DateTime.UtcNow.Year,
            month.Value,
            1,
            0,
            0,
            0,
            DateTimeKind.Utc);

        var monthEnd =
          monthStart.AddMonths(1);

        incomeFilter &=
          Builders<IncomeRecord>.Filter.Gte(
            income => income.IncomeDate,
            monthStart)
          &
          Builders<IncomeRecord>.Filter.Lt(
            income => income.IncomeDate,
            monthEnd);
      }
      else if (year.HasValue)
      {
        var yearStart =
          new DateTime(
            year.Value,
            1,
            1,
            0,
            0,
            0,
            DateTimeKind.Utc);

        var yearEnd =
          yearStart.AddYears(1);

        incomeFilter &=
          Builders<IncomeRecord>.Filter.Gte(
            income => income.IncomeDate,
            yearStart)
          &
          Builders<IncomeRecord>.Filter.Lt(
            income => income.IncomeDate,
            yearEnd);
      }

      incomes =
        await IncomeRecords
          .Find(incomeFilter)
          .ToListAsync();
    }

    /*===========================================================
      EXPENSES
    ===========================================================*/

    var expenses =
      new List<ExpenseRecord>();

    if (includeExpense)
    {
      var expenseFilter =
        Builders<ExpenseRecord>.Filter.Eq(
          expense => expense.UserId,
          userId);

      /*-------------------------------------------------------
        Filter by account type using the matching account IDs
      -------------------------------------------------------*/
      if (normalizedAccountType is not null)
      {
        expenseFilter &=
          Builders<ExpenseRecord>.Filter.In(
            expense => expense.AccountId,
            matchingAccountIds);
      }

      /*-------------------------------------------------------
        Filter by month and year using a UTC date range
      -------------------------------------------------------*/
      if (month.HasValue)
      {
        var monthStart =
          new DateTime(
            year ?? DateTime.UtcNow.Year,
            month.Value,
            1,
            0,
            0,
            0,
            DateTimeKind.Utc);

        var monthEnd =
          monthStart.AddMonths(1);

        expenseFilter &=
          Builders<ExpenseRecord>.Filter.Gte(
            expense => expense.ExpenseDate,
            monthStart)
          &
          Builders<ExpenseRecord>.Filter.Lt(
            expense => expense.ExpenseDate,
            monthEnd);
      }
      else if (year.HasValue)
      {
        var yearStart =
          new DateTime(
            year.Value,
            1,
            1,
            0,
            0,
            0,
            DateTimeKind.Utc);

        var yearEnd =
          yearStart.AddYears(1);

        expenseFilter &=
          Builders<ExpenseRecord>.Filter.Gte(
            expense => expense.ExpenseDate,
            yearStart)
          &
          Builders<ExpenseRecord>.Filter.Lt(
            expense => expense.ExpenseDate,
            yearEnd);
      }

      expenses =
        await ExpenseRecords
          .Find(expenseFilter)
          .ToListAsync();
    }

    /*===========================================================
      TRANSFERS
    ===========================================================*/

    var transfers =
      new List<AccountTransfer>();

    if (includeTransfer)
    {
      var transferFilter =
        Builders<AccountTransfer>.Filter.Eq(
          transfer => transfer.UserId,
          userId);

      /*-------------------------------------------------------
        A transfer matches an account type when either its
        source or destination account has that type.
      -------------------------------------------------------*/
      if (normalizedAccountType is not null)
      {
        var fromAccountFilter =
          Builders<AccountTransfer>.Filter.In(
            transfer => transfer.FromAccountId,
            matchingAccountIds);

        var toAccountFilter =
          Builders<AccountTransfer>.Filter.In(
            transfer => transfer.ToAccountId,
            matchingAccountIds);

        transferFilter &=
          Builders<AccountTransfer>.Filter.Or(
            fromAccountFilter,
            toAccountFilter);
      }

      /*-------------------------------------------------------
        Filter by month and year using a UTC date range
      -------------------------------------------------------*/
      if (month.HasValue)
      {
        var monthStart =
          new DateTime(
            year ?? DateTime.UtcNow.Year,
            month.Value,
            1,
            0,
            0,
            0,
            DateTimeKind.Utc);

        var monthEnd =
          monthStart.AddMonths(1);

        transferFilter &=
          Builders<AccountTransfer>.Filter.Gte(
            transfer => transfer.TransferDate,
            monthStart)
          &
          Builders<AccountTransfer>.Filter.Lt(
            transfer => transfer.TransferDate,
            monthEnd);
      }
      else if (year.HasValue)
      {
        var yearStart =
          new DateTime(
            year.Value,
            1,
            1,
            0,
            0,
            0,
            DateTimeKind.Utc);

        var yearEnd =
          yearStart.AddYears(1);

        transferFilter &=
          Builders<AccountTransfer>.Filter.Gte(
            transfer => transfer.TransferDate,
            yearStart)
          &
          Builders<AccountTransfer>.Filter.Lt(
            transfer => transfer.TransferDate,
            yearEnd);
      }

      transfers =
        await AccountTransfers
          .Find(transferFilter)
          .ToListAsync();
    }

    /*===========================================================
      BUILD THE COMBINED TRANSACTION LIST
    ===========================================================*/

    var transactions =
      new List<TransactionResponse>();

    /*---------------------------------------------------------
      Convert income records
    ---------------------------------------------------------*/
    transactions.AddRange(
      incomes.Select(income =>
      {
        var accountName =
          accountLookup.TryGetValue(
            income.AccountId,
            out var account)
            ? account.Name
            : string.Empty;

        return new TransactionResponse
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
            accountName,

          BudgetMonthId =
            income.BudgetMonthId,

          Notes =
            income.Notes,

          CreatedAtUtc =
            income.CreatedAtUtc
        };
      }));

    /*---------------------------------------------------------
      Convert expense records
    ---------------------------------------------------------*/
    transactions.AddRange(
      expenses.Select(expense =>
      {
        var accountName =
          accountLookup.TryGetValue(
            expense.AccountId,
            out var account)
            ? account.Name
            : string.Empty;

        return new TransactionResponse
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
            accountName,

          BudgetMonthId =
            expense.BudgetMonthId,

          Notes =
            expense.Notes,

          CreatedAtUtc =
            expense.CreatedAtUtc
        };
      }));

    /*---------------------------------------------------------
      Convert transfer records
    ---------------------------------------------------------*/
    transactions.AddRange(
      transfers.Select(transfer =>
      {
        var fromAccountName =
          accountLookup.TryGetValue(
            transfer.FromAccountId,
            out var fromAccount)
            ? fromAccount.Name
            : string.Empty;

        var toAccountName =
          accountLookup.TryGetValue(
            transfer.ToAccountId,
            out var toAccount)
            ? toAccount.Name
            : string.Empty;

        return new TransactionResponse
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
            fromAccountName,

          ToAccountId =
            transfer.ToAccountId,

          ToAccountName =
            toAccountName,

          Notes =
            transfer.Notes,

          CreatedAtUtc =
            transfer.CreatedAtUtc
        };
      }));

    /*---------------------------------------------------------
      Return all matching transactions with the newest first
    ---------------------------------------------------------*/
    return transactions
      .OrderByDescending(transaction =>
        transaction.TransactionDate)
      .ThenByDescending(transaction =>
        transaction.CreatedAtUtc)
      .ToList();
  }

}