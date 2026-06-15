using Microsoft.Extensions.Options;
using MongoDB.Driver;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Models;
using TaskManager.Api.Settings;

namespace TaskManager.Api.Features.Budget.Services;

public class BudgetService
{
  private readonly IMongoCollection<BudgetMonth> _budgetMonths;
  private readonly IMongoCollection<IncomeRecord> _incomeRecords;
  private readonly IMongoCollection<ExpenseRecord> _expenseRecords;

  /*=========================================================== 
  // Constructor:
  => Connects to MongoDB using settings from appsettings.json.
  => Gets the database by name.
  => Connects this service to the BudgetMonths, IncomeRecords, 
     and ExpenseRecords collections.
  ===========================================================*/
  public BudgetService(IOptions<MongoDbSettings> mongoDbSettings)
  {
    var client = new MongoClient(mongoDbSettings.Value.ConnectionString);
    var database = client.GetDatabase(mongoDbSettings.Value.DatabaseName);

    _budgetMonths = database.GetCollection<BudgetMonth>("BudgetMonths");
    _incomeRecords = database.GetCollection<IncomeRecord>("IncomeRecords");
    _expenseRecords = database.GetCollection<ExpenseRecord>("ExpenseRecords");
  }

  /*=========================================================== 
  // GetBudgetMonthsAsync:
  => Gets all budget months that belong to the logged-in user.
  => Sorts them by newest year first, then newest month first.
  => Builds a full response for each budget month, including 
      income, expenses, and totals.
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
  // GetBudgetMonthByIdAsync:
  => Gets one specific budget month by Id.
  => Also checks UserId so users can only access their own 
      budget data.
  => Returns null if the budget month does not exist or does not 
      belong to the user.
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
  // CreateBudgetMonthAsync:
  => Creates a new budget month for the logged-in user.
  => Saves the month, year, planned income, and created date.
  => Returns the newly created budget month with totals and 
      record lists.
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
  // UpdateBudgetMonthAsync:
  => Updates the planned income for an existing budget month.
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
  // DeleteBudgetMonthAsync:
  => Deletes a budget month if it belongs to the logged-in user.
  => Also deletes all income and expense records connected to that budget month.
  => Returns true if the budget month was deleted.
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

    await _incomeRecords.DeleteManyAsync(i => i.BudgetMonthId == id && i.UserId == userId);
    await _expenseRecords.DeleteManyAsync(e => e.BudgetMonthId == id && e.UserId == userId);

    var result = await _budgetMonths.DeleteOneAsync(b => b.Id == id && b.UserId == userId);

    return result.DeletedCount > 0;
  }

  /*=========================================================== 
  // AddIncomeAsync:
  => Adds a new income record to a budget month.
  => First checks that the budget month exists and belongs to the logged-in user.
  => Returns null if the budget month does not exist.
  ===========================================================*/
  public async Task<IncomeResponse?> AddIncomeAsync(
      string budgetMonthId,
      CreateIncomeRequest request,
      string userId)
  {
    var budgetMonthExists = await BudgetMonthExistsAsync(budgetMonthId, userId);

    if (!budgetMonthExists)
    {
      return null;
    }

    var incomeRecord = new IncomeRecord
    {
      UserId = userId,
      BudgetMonthId = budgetMonthId,
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
  // UpdateIncomeAsync:
  => Updates an existing income record.
  => Updates source, amount, income date, and notes.
  => Only updates the record if it belongs to the logged-in 
  user.
  ===========================================================*/
  public async Task<bool> UpdateIncomeAsync(
        string incomeId,
        UpdateIncomeRequest request,
        string userId)
  {
    var update = Builders<IncomeRecord>.Update
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
  // DeleteIncomeAsync:
  => Deletes one income record.
  => Only deletes it if the income record belongs to the 
      logged-in user.
  Returns true if the income record was deleted.
  ===========================================================*/
  public async Task<bool> DeleteIncomeAsync(string incomeId, string userId)
  {
    var result = await _incomeRecords.DeleteOneAsync(
        i => i.Id == incomeId && i.UserId == userId);

    return result.DeletedCount > 0;
  }

  /*=========================================================== 
  // AddExpenseAsync:
  => Adds a new expense record to a budget month.
  => First checks that the budget month exists and belongs to 
      the logged-in user.
  => Returns null if the budget month does not exist.
  ===========================================================*/
  public async Task<ExpenseResponse?> AddExpenseAsync(
      string budgetMonthId,
      CreateExpenseRequest request,
      string userId)
  {
    var budgetMonthExists = await BudgetMonthExistsAsync(budgetMonthId, userId);

    if (!budgetMonthExists)
    {
      return null;
    }

    var expenseRecord = new ExpenseRecord
    {
      UserId = userId,
      BudgetMonthId = budgetMonthId,
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
  // UpdateExpenseAsync:
  => Updates an existing expense record.
  => Updates category, name, amount, expense date, and notes.
  => Only updates the record if it belongs to the logged-in 
        user.
  ===========================================================*/
  public async Task<bool> UpdateExpenseAsync(
      string expenseId,
      UpdateExpenseRequest request,
      string userId)
  {
    var update = Builders<ExpenseRecord>.Update
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
  ** DeleteExpenseAsync:
  => Deletes one expense record.
  => Only deletes it if the expense record belongs to the 
      logged-in user.
  => Returns true if the expense record was deleted.
  ===========================================================*/
  public async Task<bool> DeleteExpenseAsync(string expenseId, string userId)
  {
    var result = await _expenseRecords.DeleteOneAsync(
        e => e.Id == expenseId && e.UserId == userId);

    return result.DeletedCount > 0;
  }

  /*=========================================================== 
  ** BudgetMonthExistsAsync:
  => Helper method used before adding income or expenses.
  => Checks whether the budget month exists and belongs to the 
      logged-in user.
  =? Helps prevent adding records to invalid or unauthorized 
      budget months.
  ===========================================================*/
  private async Task<bool> BudgetMonthExistsAsync(string budgetMonthId, string userId)
  {
    var budgetMonth = await _budgetMonths
        .Find(b => b.Id == budgetMonthId && b.UserId == userId)
        .FirstOrDefaultAsync();

    return budgetMonth != null;
  }

  /*===========================================================
  ** BuildBudgetMonthResponseAsync:
  => Builds the full API response for one budget month.
  => Gets all income and expense records connected to 
      the month.
  => Calculates total income, total expenses, and remaining 
      balance.
  => Converts database models into response DTOs. 
  ===========================================================*/
  private async Task<BudgetMonthResponse> BuildBudgetMonthResponseAsync(BudgetMonth budgetMonth)
  {
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

    return new BudgetMonthResponse
    {
      Id = budgetMonth.Id,
      Month = budgetMonth.Month,
      Year = budgetMonth.Year,
      PlannedIncome = budgetMonth.PlannedIncome,
      TotalIncome = totalIncome,
      TotalExpenses = totalExpenses,
      RemainingBalance = totalIncome - totalExpenses,
      IncomeRecords = incomeRecords.Select(MapIncomeResponse).ToList(),
      ExpenseRecords = expenseRecords.Select(MapExpenseResponse).ToList(),
      CreatedAtUtc = budgetMonth.CreatedAtUtc
    };
  }

  /*===========================================================
  ** MapIncomeResponse:
  => Converts an IncomeRecord database model into an 
      IncomeResponse DTO.
  => This keeps the API response clean and separate from 
      the database model. 
  ===========================================================*/

  private static IncomeResponse MapIncomeResponse(IncomeRecord incomeRecord)
  {
    return new IncomeResponse
    {
      Id = incomeRecord.Id,
      BudgetMonthId = incomeRecord.BudgetMonthId,
      Source = incomeRecord.Source,
      Amount = incomeRecord.Amount,
      IncomeDate = incomeRecord.IncomeDate,
      Notes = incomeRecord.Notes,
      CreatedAtUtc = incomeRecord.CreatedAtUtc
    };
  }

  /*===========================================================
  ** MapExpenseResponse:
  => Converts an ExpenseRecord database model into an 
      ExpenseResponse DTO.
  => This keeps the API response clean and separate from the 
      database model. 
  ===========================================================*/
  private static ExpenseResponse MapExpenseResponse(ExpenseRecord expenseRecord)
  {
    return new ExpenseResponse
    {
      Id = expenseRecord.Id,
      BudgetMonthId = expenseRecord.BudgetMonthId,
      Category = expenseRecord.Category,
      Name = expenseRecord.Name,
      Amount = expenseRecord.Amount,
      ExpenseDate = expenseRecord.ExpenseDate,
      Notes = expenseRecord.Notes,
      CreatedAtUtc = expenseRecord.CreatedAtUtc
    };
  }
}