using MongoDB.Driver;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

public class BudgetService
{
  private readonly IMongoCollection<BudgetMonth> _budgetMonths;
  private readonly IMongoCollection<BudgetCategory> _budgetCategories;
  private readonly IMongoCollection<IncomeRecord> _incomeRecords;
  private readonly IMongoCollection<ExpenseRecord> _expenseRecords;
  private readonly IMongoCollection<FinancialAccount> _financialAccounts;
  private readonly IMongoCollection<AccountTransfer> _accountTransfers;

  /*===========================================================
    BudgetService Constructor:
    => Receives the MongoDB database from Program.cs dependency injection.
    => Connects this service to budget, income, expense,
       financial account, and transfer collections.
  ===========================================================*/
  public BudgetService(IMongoDatabase database)
  {
    _budgetMonths = database.GetCollection<BudgetMonth>("BudgetMonths");
    _budgetCategories = database.GetCollection<BudgetCategory>("BudgetCategories");
    _incomeRecords = database.GetCollection<IncomeRecord>("IncomeRecords");
    _expenseRecords = database.GetCollection<ExpenseRecord>("ExpenseRecords");
    _financialAccounts = database.GetCollection<FinancialAccount>("FinancialAccounts");
    _accountTransfers = database.GetCollection<AccountTransfer>("AccountTransfers");
  }

  /*===========================================================
    GetAccountsAsync:
    => Gets all financial accounts that belong to the logged-in user.
    => Sorts accounts by account name.
    => Builds full account responses with current balances.
  ===========================================================*/
  public async Task<List<FinancialAccountResponse>> GetAccountsAsync(string userId)
  {
    var accounts = await _financialAccounts
      .Find(a => a.UserId == userId)
      .SortBy(a => a.Name)
      .ToListAsync();

    var responses = new List<FinancialAccountResponse>();

    foreach (var account in accounts)
    {
      responses.Add(await BuildFinancialAccountResponseAsync(account));
    }

    return responses;
  }

  /*===========================================================
    CreateAccountAsync:
    => Creates a new financial account for the logged-in user.
    => Examples: Checking, Savings, Visa Card, Discover Card.
    => Returns the created account with calculated current balance.
  ===========================================================*/
  public async Task<FinancialAccountResponse?> CreateAccountAsync(
    CreateFinancialAccountRequest request,
    string userId)
  {
    var account = new FinancialAccount
    {
      UserId = userId,
      Name = request.Name,
      Type = request.Type,
      StartingBalance = request.StartingBalance,
      CreatedAtUtc = DateTime.UtcNow
    };

    await _financialAccounts.InsertOneAsync(account);

    return await BuildFinancialAccountResponseAsync(account);
  }

  /*===========================================================
    UpdateAccountAsync:
    => Updates an existing financial account.
    => Allows changing account name, type, and starting balance.
    => Only updates the account if it belongs to the logged-in user.
  ===========================================================*/
  public async Task<FinancialAccountResponse?> UpdateAccountAsync(
    string accountId,
    UpdateFinancialAccountRequest request,
    string userId)
  {
    var update = Builders<FinancialAccount>.Update
      .Set(a => a.Name, request.Name)
      .Set(a => a.Type, request.Type)
      .Set(a => a.StartingBalance, request.StartingBalance);

    var result = await _financialAccounts.UpdateOneAsync(
      a => a.Id == accountId && a.UserId == userId,
      update);

    if (result.MatchedCount == 0)
    {
      return null;
    }

    var account = await _financialAccounts
      .Find(a => a.Id == accountId && a.UserId == userId)
      .FirstOrDefaultAsync();

    return account == null ? null : await BuildFinancialAccountResponseAsync(account);
  }

  /*===========================================================
    DeleteAccountAsync:
    => Deletes one financial account.
    => Only deletes the account if it belongs to the logged-in user.
    => Returns the deleted account information.
  ===========================================================*/
  public async Task<FinancialAccountResponse?> DeleteAccountAsync(
    string accountId,
    string userId)
  {
    var account = await _financialAccounts
      .Find(a => a.Id == accountId && a.UserId == userId)
      .FirstOrDefaultAsync();

    if (account == null)
    {
      return null;
    }

    await _financialAccounts.DeleteOneAsync(
      a => a.Id == accountId && a.UserId == userId);

    return await BuildFinancialAccountResponseAsync(account);
  }

  /*===========================================================
    GetTransfersAsync:
    => Gets all account transfers for the logged-in user.
    => Sorts transfers by newest transfer date first.
    => Returns clean transfer response DTOs.
  ===========================================================*/
  public async Task<List<AccountTransferResponse>> GetTransfersAsync(string userId)
  {
    var transfers = await _accountTransfers
      .Find(t => t.UserId == userId)
      .SortByDescending(t => t.TransferDate)
      .ToListAsync();

    return transfers.Select(MapAccountTransferResponse).ToList();
  }

  /*===========================================================
    CreateTransferAsync:
    => Creates a transfer between two financial accounts.
    => Examples: Checking to Savings, Checking to Credit Card.
    => Verifies both accounts belong to the logged-in user.
  ===========================================================*/
  public async Task<AccountTransferResponse?> CreateTransferAsync(
    CreateAccountTransferRequest request,
    string userId)
  {
    var fromAccountExists = await AccountExistsAsync(request.FromAccountId, userId);
    var toAccountExists = await AccountExistsAsync(request.ToAccountId, userId);

    if (!fromAccountExists || !toAccountExists)
    {
      return null;
    }

    var transfer = new AccountTransfer
    {
      UserId = userId,
      FromAccountId = request.FromAccountId,
      ToAccountId = request.ToAccountId,
      Amount = request.Amount,
      TransferDate = request.TransferDate,
      Notes = request.Notes,
      CreatedAtUtc = DateTime.UtcNow
    };

    await _accountTransfers.InsertOneAsync(transfer);

    return MapAccountTransferResponse(transfer);
  }

  /*===========================================================
    DeleteTransferAsync:
    => Deletes one account transfer.
    => Only deletes the transfer if it belongs to the logged-in user.
    => Returns the deleted transfer information.
  ===========================================================*/
  public async Task<AccountTransferResponse?> DeleteTransferAsync(
    string transferId,
    string userId)
  {
    var transfer = await _accountTransfers
      .Find(t => t.Id == transferId && t.UserId == userId)
      .FirstOrDefaultAsync();

    if (transfer == null)
    {
      return null;
    }

    await _accountTransfers.DeleteOneAsync(
      t => t.Id == transferId && t.UserId == userId);

    return MapAccountTransferResponse(transfer);
  }

  /*===========================================================
    GetBudgetMonthsAsync:
    => Gets all budget months that belong to the logged-in user.
    => Sorts them by newest year and newest month first.
    => Builds full response data with totals and records.
  ===========================================================*/
  public async Task<List<BudgetMonthResponse>> GetBudgetMonthsAsync(string userId)
  {
    var budgetMonths = await _budgetMonths
      .Find(b => b.UserId == userId)
      .SortByDescending(b => b.Year)
      .ThenByDescending(b => b.Month)
      .ToListAsync();

    var responses = new List<BudgetMonthResponse>();

    foreach (var budgetMonth in budgetMonths)
    {
      responses.Add(await BuildBudgetMonthResponseAsync(budgetMonth));
    }

    return responses;
  }

  /*===========================================================
    GetBudgetMonthByIdAsync:
    => Gets one budget month by ID.
    => Makes sure the budget month belongs to the logged-in user.
    => Returns null if the budget month does not exist.
  ===========================================================*/
  public async Task<BudgetMonthResponse?> GetBudgetMonthByIdAsync(string id, string userId)
  {
    var budgetMonth = await _budgetMonths
      .Find(b => b.Id == id && b.UserId == userId)
      .FirstOrDefaultAsync();

    if (budgetMonth == null)
    {
      return null;
    }

    return await BuildBudgetMonthResponseAsync(budgetMonth);
  }

  /*===========================================================
    CreateBudgetMonthAsync:
    => Creates a new monthly budget for the logged-in user.
    => Stores planned income, month, and year.
    => Returns the created budget month response.
  ===========================================================*/
  public async Task<BudgetMonthResponse> CreateBudgetMonthAsync(
    CreateBudgetMonthRequest request,
    string userId)
  {
    var budgetMonth = new BudgetMonth
    {
      UserId = userId,
      Month = request.Month,
      Year = request.Year,
      PlannedIncome = request.PlannedIncome,
      CreatedAtUtc = DateTime.UtcNow
    };

    await _budgetMonths.InsertOneAsync(budgetMonth);

    return await BuildBudgetMonthResponseAsync(budgetMonth);
  }

  /*===========================================================
    UpdateBudgetMonthAsync:
    => Updates the planned income for a budget month.
    => Only updates the record if it belongs to the logged-in user.
    => Returns true if a matching budget month was found.
  ===========================================================*/
  public async Task<bool> UpdateBudgetMonthAsync(
    string id,
    UpdateBudgetMonthRequest request,
    string userId)
  {
    var update = Builders<BudgetMonth>.Update
      .Set(b => b.PlannedIncome, request.PlannedIncome);

    var result = await _budgetMonths.UpdateOneAsync(
      b => b.Id == id && b.UserId == userId,
      update);

    return result.MatchedCount > 0;
  }

  /*===========================================================
    DeleteBudgetMonthAsync:
    => Deletes a budget month that belongs to the logged-in user.
    => Also deletes related categories, income records, and expense records.
    => Prevents orphaned budget data from staying in MongoDB.
  ===========================================================*/
  public async Task<bool> DeleteBudgetMonthAsync(string id, string userId)
  {
    var budgetMonth = await _budgetMonths
      .Find(b => b.Id == id && b.UserId == userId)
      .FirstOrDefaultAsync();

    if (budgetMonth == null)
    {
      return false;
    }

    await _budgetCategories.DeleteManyAsync(c => c.BudgetMonthId == id && c.UserId == userId);
    await _incomeRecords.DeleteManyAsync(i => i.BudgetMonthId == id && i.UserId == userId);
    await _expenseRecords.DeleteManyAsync(e => e.BudgetMonthId == id && e.UserId == userId);

    var result = await _budgetMonths.DeleteOneAsync(b => b.Id == id && b.UserId == userId);

    return result.DeletedCount > 0;
  }

  /*===========================================================
    AddBudgetCategoryAsync:
    => Creates a planned budget category for a budget month.
    => Examples: Mortgage, Groceries, Emergency Fund, Student Loan.
    => Verifies that the budget month belongs to the logged-in user.
  ===========================================================*/
  public async Task<BudgetCategoryResponse?> AddBudgetCategoryAsync(
    string budgetMonthId,
    CreateBudgetCategoryRequest request,
    string userId)
  {
    var budgetMonthExists = await BudgetMonthExistsAsync(budgetMonthId, userId);

    if (!budgetMonthExists)
    {
      return null;
    }

    var category = new BudgetCategory
    {
      UserId = userId,
      BudgetMonthId = budgetMonthId,
      Name = request.Name,
      Type = request.Type,
      PlannedAmount = request.PlannedAmount,
      CreatedAtUtc = DateTime.UtcNow
    };

    await _budgetCategories.InsertOneAsync(category);

    var expenses = await _expenseRecords
      .Find(e =>
        e.BudgetMonthId == budgetMonthId &&
        e.UserId == userId &&
        e.Category.ToLower() == category.Name.ToLower())
      .ToListAsync();

    return MapBudgetCategoryResponse(category, expenses);
  }

  /*===========================================================
    UpdateBudgetCategoryAsync:
    => Updates a budget category's name, type, and planned amount.
    => Only updates the category if it belongs to the logged-in user.
    => Returns true if a matching category was found.
  ===========================================================*/
  public async Task<bool> UpdateBudgetCategoryAsync(
    string categoryId,
    UpdateBudgetCategoryRequest request,
    string userId)
  {
    var update = Builders<BudgetCategory>.Update
      .Set(c => c.Name, request.Name)
      .Set(c => c.Type, request.Type)
      .Set(c => c.PlannedAmount, request.PlannedAmount);

    var result = await _budgetCategories.UpdateOneAsync(
      c => c.Id == categoryId && c.UserId == userId,
      update);

    return result.MatchedCount > 0;
  }

  /*===========================================================
    DeleteBudgetCategoryAsync:
    => Deletes one planned budget category.
    => Only deletes the category if it belongs to the logged-in user.
    => Does not delete actual expense records.
  ===========================================================*/
  public async Task<BudgetCategoryResponse?> DeleteBudgetCategoryAsync(
    string categoryId,
    string userId)
  {
    var category = await _budgetCategories
      .Find(c => c.Id == categoryId && c.UserId == userId)
      .FirstOrDefaultAsync();

    if (category == null)
    {
      return null;
    }

    await _budgetCategories.DeleteOneAsync(
      c => c.Id == categoryId && c.UserId == userId);

    var expenses = await _expenseRecords
      .Find(e =>
        e.BudgetMonthId == category.BudgetMonthId &&
        e.UserId == userId &&
        e.Category.ToLower() == category.Name.ToLower())
      .ToListAsync();

    return MapBudgetCategoryResponse(category, expenses);
  }

  /*===========================================================
    AddIncomeAsync:
    => Creates a new income record for a budget month.
    => Verifies the budget month and account belong to the user.
    => Adds the income amount to the selected financial account.
  ===========================================================*/
  public async Task<IncomeResponse?> AddIncomeAsync(
    string budgetMonthId,
    CreateIncomeRequest request,
    string userId)
  {
    var budgetMonthExists = await BudgetMonthExistsAsync(budgetMonthId, userId);
    var accountExists = await AccountExistsAsync(request.AccountId, userId);

    if (!budgetMonthExists || !accountExists)
    {
      return null;
    }

    var incomeRecord = new IncomeRecord
    {
      UserId = userId,
      BudgetMonthId = budgetMonthId,
      AccountId = request.AccountId,
      Source = request.Source,
      Amount = request.Amount,
      IncomeDate = request.IncomeDate,
      Notes = request.Notes,
      CreatedAtUtc = DateTime.UtcNow
    };

    await _incomeRecords.InsertOneAsync(incomeRecord);

    return MapIncomeResponse(incomeRecord);
  }

  /*===========================================================
    UpdateIncomeAsync:
    => Updates an existing income record.
    => Verifies the selected account belongs to the user.
    => Returns true if a matching income record was found.
  ===========================================================*/
  public async Task<bool> UpdateIncomeAsync(
    string incomeId,
    UpdateIncomeRequest request,
    string userId)
  {
    var accountExists = await AccountExistsAsync(request.AccountId, userId);

    if (!accountExists)
    {
      return false;
    }

    var update = Builders<IncomeRecord>.Update
      .Set(i => i.AccountId, request.AccountId)
      .Set(i => i.Source, request.Source)
      .Set(i => i.Amount, request.Amount)
      .Set(i => i.IncomeDate, request.IncomeDate)
      .Set(i => i.Notes, request.Notes);

    var result = await _incomeRecords.UpdateOneAsync(
      i => i.Id == incomeId && i.UserId == userId,
      update);

    return result.MatchedCount > 0;
  }

  /*===========================================================
    DeleteIncomeAsync:
    => Deletes one income record.
    => Only deletes the income if it belongs to the logged-in user.
    => Returns the deleted income information.
  ===========================================================*/
  public async Task<IncomeResponse?> DeleteIncomeAsync(
    string incomeId,
    string userId)
  {
    var income = await _incomeRecords
      .Find(i => i.Id == incomeId && i.UserId == userId)
      .FirstOrDefaultAsync();

    if (income == null)
    {
      return null;
    }

    await _incomeRecords.DeleteOneAsync(
      i => i.Id == incomeId && i.UserId == userId);

    return MapIncomeResponse(income);
  }

  /*===========================================================
    AddExpenseAsync:
    => Creates a new expense record for a budget month.
    => Verifies the budget month and account belong to the user.
    => Subtracts the expense amount from the selected account.
  ===========================================================*/
  public async Task<ExpenseResponse?> AddExpenseAsync(
    string budgetMonthId,
    CreateExpenseRequest request,
    string userId)
  {
    var budgetMonthExists = await BudgetMonthExistsAsync(budgetMonthId, userId);
    var accountExists = await AccountExistsAsync(request.AccountId, userId);

    if (!budgetMonthExists || !accountExists)
    {
      return null;
    }

    var expenseRecord = new ExpenseRecord
    {
      UserId = userId,
      BudgetMonthId = budgetMonthId,
      AccountId = request.AccountId,
      Category = request.Category,
      Name = request.Name,
      Amount = request.Amount,
      ExpenseDate = request.ExpenseDate,
      Notes = request.Notes,
      CreatedAtUtc = DateTime.UtcNow
    };

    await _expenseRecords.InsertOneAsync(expenseRecord);

    return MapExpenseResponse(expenseRecord);
  }

  /*===========================================================
    UpdateExpenseAsync:
    => Updates an existing expense record.
    => Verifies the selected account belongs to the user.
    => Returns true if a matching expense record was found.
  ===========================================================*/
  public async Task<bool> UpdateExpenseAsync(
    string expenseId,
    UpdateExpenseRequest request,
    string userId)
  {
    var accountExists = await AccountExistsAsync(request.AccountId, userId);

    if (!accountExists)
    {
      return false;
    }

    var update = Builders<ExpenseRecord>.Update
      .Set(e => e.AccountId, request.AccountId)
      .Set(e => e.Category, request.Category)
      .Set(e => e.Name, request.Name)
      .Set(e => e.Amount, request.Amount)
      .Set(e => e.ExpenseDate, request.ExpenseDate)
      .Set(e => e.Notes, request.Notes);

    var result = await _expenseRecords.UpdateOneAsync(
      e => e.Id == expenseId && e.UserId == userId,
      update);

    return result.MatchedCount > 0;
  }

  /*===========================================================
    DeleteExpenseAsync:
    => Deletes one expense record.
    => Only deletes the expense if it belongs to the logged-in user.
    => Returns the deleted expense information.
  ===========================================================*/
  public async Task<ExpenseResponse?> DeleteExpenseAsync(
    string expenseId,
    string userId)
  {
    var expense = await _expenseRecords
      .Find(e => e.Id == expenseId && e.UserId == userId)
      .FirstOrDefaultAsync();

    if (expense == null)
    {
      return null;
    }

    await _expenseRecords.DeleteOneAsync(
      e => e.Id == expenseId && e.UserId == userId);

    return MapExpenseResponse(expense);
  }

  /*===========================================================
    BudgetMonthExistsAsync:
    => Checks if a budget month exists for the logged-in user.
    => Used before adding income, expenses, or categories.
    => Prevents users from adding records to someone else's budget.
  ===========================================================*/
  private async Task<bool> BudgetMonthExistsAsync(string budgetMonthId, string userId)
  {
    var budgetMonth = await _budgetMonths
      .Find(b => b.Id == budgetMonthId && b.UserId == userId)
      .FirstOrDefaultAsync();

    return budgetMonth != null;
  }

  /*===========================================================
    AccountExistsAsync:
    => Checks if a financial account exists for the logged-in user.
    => Used before adding income, expenses, or transfers.
    => Prevents users from using someone else's account ID.
  ===========================================================*/
  private async Task<bool> AccountExistsAsync(string accountId, string userId)
  {
    var account = await _financialAccounts
      .Find(a => a.Id == accountId && a.UserId == userId)
      .FirstOrDefaultAsync();

    return account != null;
  }

  /*===========================================================
    BuildFinancialAccountResponseAsync:
    => Builds a full financial account response.
    => Calculates current balance using income, expenses,
       transfers out, and transfers in.
    => Keeps balance calculation inside the service layer.
  ===========================================================*/
  private async Task<FinancialAccountResponse> BuildFinancialAccountResponseAsync(
    FinancialAccount account)
  {
    var incomeTotal = await _incomeRecords
      .Find(i => i.AccountId == account.Id && i.UserId == account.UserId)
      .ToListAsync();

    var expenseTotal = await _expenseRecords
      .Find(e => e.AccountId == account.Id && e.UserId == account.UserId)
      .ToListAsync();

    var transfersOut = await _accountTransfers
      .Find(t => t.FromAccountId == account.Id && t.UserId == account.UserId)
      .ToListAsync();

    var transfersIn = await _accountTransfers
      .Find(t => t.ToAccountId == account.Id && t.UserId == account.UserId)
      .ToListAsync();

    var currentBalance =
      account.StartingBalance
      + incomeTotal.Sum(i => i.Amount)
      - expenseTotal.Sum(e => e.Amount)
      - transfersOut.Sum(t => t.Amount)
      + transfersIn.Sum(t => t.Amount);

    return new FinancialAccountResponse
    {
      Id = account.Id,
      Name = account.Name,
      Type = account.Type,
      StartingBalance = account.StartingBalance,
      CurrentBalance = currentBalance,
      CreatedAtUtc = account.CreatedAtUtc
    };
  }

  /*===========================================================
    BuildBudgetMonthResponseAsync:
    => Builds the full budget month response.
    => Loads categories, income records, and expense records.
    => Calculates actual totals and zero-based budgeting numbers.
  ===========================================================*/
  private async Task<BudgetMonthResponse> BuildBudgetMonthResponseAsync(BudgetMonth budgetMonth)
  {
    var budgetCategories = await _budgetCategories
      .Find(c => c.BudgetMonthId == budgetMonth.Id && c.UserId == budgetMonth.UserId)
      .SortBy(c => c.Name)
      .ToListAsync();

    var incomeRecords = await _incomeRecords
      .Find(i => i.BudgetMonthId == budgetMonth.Id && i.UserId == budgetMonth.UserId)
      .SortByDescending(i => i.IncomeDate)
      .ToListAsync();

    var expenseRecords = await _expenseRecords
      .Find(e => e.BudgetMonthId == budgetMonth.Id && e.UserId == budgetMonth.UserId)
      .SortByDescending(e => e.ExpenseDate)
      .ToListAsync();

    var totalIncome = incomeRecords.Sum(i => i.Amount);
    var totalExpenses = expenseRecords.Sum(e => e.Amount);

    var totalPlannedExpenses = budgetCategories
      .Where(c => c.Type.Equals("Expense", StringComparison.OrdinalIgnoreCase))
      .Sum(c => c.PlannedAmount);

    var totalPlannedSavings = budgetCategories
      .Where(c => c.Type.Equals("Savings", StringComparison.OrdinalIgnoreCase))
      .Sum(c => c.PlannedAmount);

    var totalPlannedDebt = budgetCategories
      .Where(c => c.Type.Equals("Debt", StringComparison.OrdinalIgnoreCase))
      .Sum(c => c.PlannedAmount);

    var totalAssigned = budgetCategories.Sum(c => c.PlannedAmount);

    var categoryResponses = budgetCategories
      .Select(category => MapBudgetCategoryResponse(category, expenseRecords))
      .ToList();

    return new BudgetMonthResponse
    {
      Id = budgetMonth.Id,
      Month = budgetMonth.Month,
      Year = budgetMonth.Year,
      PlannedIncome = budgetMonth.PlannedIncome,

      TotalIncome = totalIncome,
      TotalExpenses = totalExpenses,
      RemainingBalance = totalIncome - totalExpenses,

      TotalPlannedExpenses = totalPlannedExpenses,
      TotalPlannedSavings = totalPlannedSavings,
      TotalPlannedDebt = totalPlannedDebt,
      TotalAssigned = totalAssigned,
      LeftToAssign = budgetMonth.PlannedIncome - totalAssigned,
      RemainingPlannedExpenseBudget = totalPlannedExpenses - totalExpenses,

      BudgetCategories = categoryResponses,
      IncomeRecords = incomeRecords.Select(MapIncomeResponse).ToList(),
      ExpenseRecords = expenseRecords.Select(MapExpenseResponse).ToList(),
      CreatedAtUtc = budgetMonth.CreatedAtUtc
    };
  }

  /*===========================================================
    MapBudgetCategoryResponse:
    => Converts a BudgetCategory database model into a DTO.
    => Calculates how much was spent in that category.
    => Calculates how much budget is remaining.
  ===========================================================*/
  private static BudgetCategoryResponse MapBudgetCategoryResponse(
    BudgetCategory category,
    List<ExpenseRecord> expenseRecords)
  {
    var spentAmount = expenseRecords
      .Where(e => string.Equals(
        e.Category,
        category.Name,
        StringComparison.OrdinalIgnoreCase))
      .Sum(e => e.Amount);

    return new BudgetCategoryResponse
    {
      Id = category.Id,
      BudgetMonthId = category.BudgetMonthId,
      Name = category.Name,
      Type = category.Type,
      PlannedAmount = category.PlannedAmount,
      SpentAmount = spentAmount,
      RemainingAmount = category.PlannedAmount - spentAmount,
      CreatedAtUtc = category.CreatedAtUtc
    };
  }

  /*===========================================================
    MapIncomeResponse:
    => Converts an IncomeRecord database model into an IncomeResponse DTO.
    => Includes the financial account ID connected to this income.
    => Keeps API response data separate from MongoDB models.
  ===========================================================*/
  private static IncomeResponse MapIncomeResponse(IncomeRecord incomeRecord)
  {
    return new IncomeResponse
    {
      Id = incomeRecord.Id,
      BudgetMonthId = incomeRecord.BudgetMonthId,
      AccountId = incomeRecord.AccountId,
      Source = incomeRecord.Source,
      Amount = incomeRecord.Amount,
      IncomeDate = incomeRecord.IncomeDate,
      Notes = incomeRecord.Notes,
      CreatedAtUtc = incomeRecord.CreatedAtUtc
    };
  }

  /*===========================================================
    MapExpenseResponse:
    => Converts an ExpenseRecord database model into an ExpenseResponse DTO.
    => Includes the financial account ID connected to this expense.
    => Keeps API response data separate from MongoDB models.
  ===========================================================*/
  private static ExpenseResponse MapExpenseResponse(ExpenseRecord expenseRecord)
  {
    return new ExpenseResponse
    {
      Id = expenseRecord.Id,
      BudgetMonthId = expenseRecord.BudgetMonthId,
      AccountId = expenseRecord.AccountId,
      Category = expenseRecord.Category,
      Name = expenseRecord.Name,
      Amount = expenseRecord.Amount,
      ExpenseDate = expenseRecord.ExpenseDate,
      Notes = expenseRecord.Notes,
      CreatedAtUtc = expenseRecord.CreatedAtUtc
    };
  }

  /*===========================================================
    MapAccountTransferResponse:
    => Converts an AccountTransfer database model into a DTO.
    => Keeps transfer API responses clean.
    => Separates MongoDB models from API response models.
  ===========================================================*/
  private static AccountTransferResponse MapAccountTransferResponse(
    AccountTransfer transfer)
  {
    return new AccountTransferResponse
    {
      Id = transfer.Id,
      FromAccountId = transfer.FromAccountId,
      ToAccountId = transfer.ToAccountId,
      Amount = transfer.Amount,
      TransferDate = transfer.TransferDate,
      Notes = transfer.Notes,
      CreatedAtUtc = transfer.CreatedAtUtc
    };
  }

  /*===========================================================
  PatchIncomeAsync:
  => Updates only the income fields that were sent in the request.
  => Allows partial updates without requiring the full income object.
  => Returns the updated income record.
===========================================================*/
  public async Task<IncomeResponse?> PatchIncomeAsync(
    string incomeId,
    PatchIncomeRequest request,
    string userId)
  {
    var income = await _incomeRecords
      .Find(i => i.Id == incomeId && i.UserId == userId)
      .FirstOrDefaultAsync();

    if (income == null)
    {
      return null;
    }

    var updates = new List<UpdateDefinition<IncomeRecord>>();

    if (request.AccountId != null)
    {
      var accountExists = await AccountExistsAsync(request.AccountId, userId);

      if (!accountExists)
      {
        return null;
      }

      updates.Add(Builders<IncomeRecord>.Update.Set(i => i.AccountId, request.AccountId));
    }

    if (request.Source != null)
    {
      updates.Add(Builders<IncomeRecord>.Update.Set(i => i.Source, request.Source));
    }

    if (request.Amount.HasValue)
    {
      updates.Add(Builders<IncomeRecord>.Update.Set(i => i.Amount, request.Amount.Value));
    }

    if (request.IncomeDate.HasValue)
    {
      updates.Add(Builders<IncomeRecord>.Update.Set(i => i.IncomeDate, request.IncomeDate.Value));
    }

    if (request.Notes != null)
    {
      updates.Add(Builders<IncomeRecord>.Update.Set(i => i.Notes, request.Notes));
    }

    if (updates.Count == 0)
    {
      return MapIncomeResponse(income);
    }

    var update = Builders<IncomeRecord>.Update.Combine(updates);

    await _incomeRecords.UpdateOneAsync(
      i => i.Id == incomeId && i.UserId == userId,
      update);

    var updatedIncome = await _incomeRecords
      .Find(i => i.Id == incomeId && i.UserId == userId)
      .FirstOrDefaultAsync();

    return updatedIncome == null ? null : MapIncomeResponse(updatedIncome);
  }

  /*===========================================================
  PatchExpenseAsync:
  => Updates only the expense fields that were sent in the request.
  => Allows partial updates without requiring the full expense object.
  => Returns the updated expense record.
===========================================================*/
  public async Task<ExpenseResponse?> PatchExpenseAsync(
    string expenseId,
    PatchExpenseRequest request,
    string userId)
  {
    var expense = await _expenseRecords
      .Find(e => e.Id == expenseId && e.UserId == userId)
      .FirstOrDefaultAsync();

    if (expense == null)
    {
      return null;
    }

    var updates = new List<UpdateDefinition<ExpenseRecord>>();

    if (request.AccountId != null)
    {
      var accountExists = await AccountExistsAsync(request.AccountId, userId);

      if (!accountExists)
      {
        return null;
      }

      updates.Add(Builders<ExpenseRecord>.Update.Set(e => e.AccountId, request.AccountId));
    }

    if (request.Category != null)
    {
      updates.Add(Builders<ExpenseRecord>.Update.Set(e => e.Category, request.Category));
    }

    if (request.Name != null)
    {
      updates.Add(Builders<ExpenseRecord>.Update.Set(e => e.Name, request.Name));
    }

    if (request.Amount.HasValue)
    {
      updates.Add(Builders<ExpenseRecord>.Update.Set(e => e.Amount, request.Amount.Value));
    }

    if (request.ExpenseDate.HasValue)
    {
      updates.Add(Builders<ExpenseRecord>.Update.Set(e => e.ExpenseDate, request.ExpenseDate.Value));
    }

    if (request.Notes != null)
    {
      updates.Add(Builders<ExpenseRecord>.Update.Set(e => e.Notes, request.Notes));
    }

    if (updates.Count == 0)
    {
      return MapExpenseResponse(expense);
    }

    var update = Builders<ExpenseRecord>.Update.Combine(updates);

    await _expenseRecords.UpdateOneAsync(
      e => e.Id == expenseId && e.UserId == userId,
      update);

    var updatedExpense = await _expenseRecords
      .Find(e => e.Id == expenseId && e.UserId == userId)
      .FirstOrDefaultAsync();

    return updatedExpense == null ? null : MapExpenseResponse(updatedExpense);
  }

  /*===========================================================
  PatchTransferAsync:
  => Updates only the transfer fields that were sent in the request.
  => Used for partial edits to credit card payments or account transfers.
  => Returns the updated transfer record.
===========================================================*/
  public async Task<AccountTransferResponse?> PatchTransferAsync(
    string transferId,
    PatchAccountTransferRequest request,
    string userId)
  {
    var transfer = await _accountTransfers
      .Find(t => t.Id == transferId && t.UserId == userId)
      .FirstOrDefaultAsync();

    if (transfer == null)
    {
      return null;
    }

    var updates = new List<UpdateDefinition<AccountTransfer>>();

    if (request.FromAccountId != null)
    {
      var fromAccountExists = await AccountExistsAsync(request.FromAccountId, userId);

      if (!fromAccountExists)
      {
        return null;
      }

      updates.Add(Builders<AccountTransfer>.Update.Set(t => t.FromAccountId, request.FromAccountId));
    }

    if (request.ToAccountId != null)
    {
      var toAccountExists = await AccountExistsAsync(request.ToAccountId, userId);

      if (!toAccountExists)
      {
        return null;
      }

      updates.Add(Builders<AccountTransfer>.Update.Set(t => t.ToAccountId, request.ToAccountId));
    }

    var newFromAccountId = request.FromAccountId ?? transfer.FromAccountId;
    var newToAccountId = request.ToAccountId ?? transfer.ToAccountId;

    if (newFromAccountId == newToAccountId)
    {
      return null;
    }

    if (request.Amount.HasValue)
    {
      updates.Add(Builders<AccountTransfer>.Update.Set(t => t.Amount, request.Amount.Value));
    }

    if (request.TransferDate.HasValue)
    {
      updates.Add(Builders<AccountTransfer>.Update.Set(t => t.TransferDate, request.TransferDate.Value));
    }

    if (request.Notes != null)
    {
      updates.Add(Builders<AccountTransfer>.Update.Set(t => t.Notes, request.Notes));
    }

    if (updates.Count == 0)
    {
      return MapAccountTransferResponse(transfer);
    }

    var update = Builders<AccountTransfer>.Update.Combine(updates);

    await _accountTransfers.UpdateOneAsync(
      t => t.Id == transferId && t.UserId == userId,
      update);

    var updatedTransfer = await _accountTransfers
      .Find(t => t.Id == transferId && t.UserId == userId)
      .FirstOrDefaultAsync();

    return updatedTransfer == null ? null : MapAccountTransferResponse(updatedTransfer);
  }

  /*===========================================================
  DeleteAllBudgetDataAsync:
  => Deletes all finance and budget data for the logged-in user.
  => Deletes accounts, transfers, budget months, categories, income, and expenses.
  => Returns the number of records deleted from each collection.
===========================================================*/
  public async Task<CleanSlateResponse> DeleteAllBudgetDataAsync(string userId)
  {
    var deletedTransfers = await _accountTransfers.DeleteManyAsync(
      t => t.UserId == userId);

    var deletedAccounts = await _financialAccounts.DeleteManyAsync(
      a => a.UserId == userId);

    var deletedBudgetCategories = await _budgetCategories.DeleteManyAsync(
      c => c.UserId == userId);

    var deletedIncomeRecords = await _incomeRecords.DeleteManyAsync(
      i => i.UserId == userId);

    var deletedExpenseRecords = await _expenseRecords.DeleteManyAsync(
      e => e.UserId == userId);

    var deletedBudgetMonths = await _budgetMonths.DeleteManyAsync(
      b => b.UserId == userId);

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