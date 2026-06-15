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

  public BudgetService(IOptions<MongoDbSettings> mongoDbSettings)
  {
    var client = new MongoClient(mongoDbSettings.Value.ConnectionString);
    var database = client.GetDatabase(mongoDbSettings.Value.DatabaseName);

    _budgetMonths = database.GetCollection<BudgetMonth>("BudgetMonths");
    _incomeRecords = database.GetCollection<IncomeRecord>("IncomeRecords");
    _expenseRecords = database.GetCollection<ExpenseRecord>("ExpenseRecords");
  }

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

  public async Task<bool> DeleteIncomeAsync(string incomeId, string userId)
  {
    var result = await _incomeRecords.DeleteOneAsync(
        i => i.Id == incomeId && i.UserId == userId);

    return result.DeletedCount > 0;
  }

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

  public async Task<bool> DeleteExpenseAsync(string expenseId, string userId)
  {
    var result = await _expenseRecords.DeleteOneAsync(
        e => e.Id == expenseId && e.UserId == userId);

    return result.DeletedCount > 0;
  }

  private async Task<bool> BudgetMonthExistsAsync(string budgetMonthId, string userId)
  {
    var budgetMonth = await _budgetMonths
        .Find(b => b.Id == budgetMonthId && b.UserId == userId)
        .FirstOrDefaultAsync();

    return budgetMonth != null;
  }

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