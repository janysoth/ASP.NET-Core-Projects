using MongoDB.Driver;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Mappers;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

public class BudgetMonthService : BudgetBaseService
{
  /*===========================================================
    BudgetMonthService Constructor
  ===========================================================*/
  public BudgetMonthService(IMongoDatabase database)
    : base(database)
  {
  }

  /*===========================================================
    GetBudgetMonthsAsync
  ===========================================================*/
  public async Task<List<BudgetMonthResponse>> GetBudgetMonthsAsync(
    string userId)
  {
    /*---------------------------------------------------------
      Get user's budget months from MongoDB
    ---------------------------------------------------------*/
    var budgetMonths = await BudgetMonths
      .Find(b => b.UserId == userId)
      .SortByDescending(b => b.Year)
      .ThenByDescending(b => b.Month)
      .ToListAsync();

    /*---------------------------------------------------------
      Build complete response objects
    ---------------------------------------------------------*/
    var responses = new List<BudgetMonthResponse>();

    foreach (var budgetMonth in budgetMonths)
    {
      responses.Add(await BuildBudgetMonthResponseAsync(budgetMonth));
    }

    return responses;
  }

  /*===========================================================
    GetBudgetMonthByIdAsync
  ===========================================================*/
  public async Task<BudgetMonthResponse?> GetBudgetMonthByIdAsync(
    string id,
    string userId)
  {
    var budgetMonth = await BudgetMonths
      .Find(b => b.Id == id && b.UserId == userId)
      .FirstOrDefaultAsync();

    if (budgetMonth == null)
    {
      return null;
    }

    return await BuildBudgetMonthResponseAsync(budgetMonth);
  }

  /*===========================================================
    CreateBudgetMonthAsync
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

    await BudgetMonths.InsertOneAsync(budgetMonth);

    return await BuildBudgetMonthResponseAsync(budgetMonth);
  }

  /*===========================================================
    UpdateBudgetMonthAsync
  ===========================================================*/
  public async Task<BudgetMonthResponse?> UpdateBudgetMonthAsync(
    string id,
    UpdateBudgetMonthRequest request,
    string userId)
  {
    var update = Builders<BudgetMonth>.Update
      .Set(b => b.PlannedIncome, request.PlannedIncome);

    var result = await BudgetMonths.UpdateOneAsync(
      b => b.Id == id && b.UserId == userId,
      update);

    if (result.MatchedCount == 0)
    {
      return null;
    }

    return await GetBudgetMonthByIdAsync(id, userId);
  }

  /*===========================================================
    DeleteBudgetMonthAsync
  ===========================================================*/
  public async Task<BudgetMonthResponse?> DeleteBudgetMonthAsync(
    string id,
    string userId)
  {
    /*---------------------------------------------------------
      Find budget month before deleting
    ---------------------------------------------------------*/
    var budgetMonth = await BudgetMonths
      .Find(b => b.Id == id && b.UserId == userId)
      .FirstOrDefaultAsync();

    if (budgetMonth == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Build response before records are removed
    ---------------------------------------------------------*/
    var deletedBudgetMonth = await BuildBudgetMonthResponseAsync(budgetMonth);

    /*---------------------------------------------------------
      Delete related child records first
    ---------------------------------------------------------*/
    await BudgetCategories.DeleteManyAsync(
      c => c.BudgetMonthId == id && c.UserId == userId);

    await IncomeRecords.DeleteManyAsync(
      i => i.BudgetMonthId == id && i.UserId == userId);

    await ExpenseRecords.DeleteManyAsync(
      e => e.BudgetMonthId == id && e.UserId == userId);

    /*---------------------------------------------------------
      Delete parent budget month
    ---------------------------------------------------------*/
    var deleteResult = await BudgetMonths.DeleteOneAsync(
      b => b.Id == id && b.UserId == userId);

    if (deleteResult.DeletedCount == 0)
    {
      return null;
    }

    return deletedBudgetMonth;
  }

  /*===========================================================
    BuildBudgetMonthResponseAsync
  ===========================================================*/
  private async Task<BudgetMonthResponse> BuildBudgetMonthResponseAsync(
    BudgetMonth budgetMonth)
  {
    /*---------------------------------------------------------
      Get related records
    ---------------------------------------------------------*/
    var budgetCategories = await BudgetCategories
      .Find(c => c.BudgetMonthId == budgetMonth.Id &&
                 c.UserId == budgetMonth.UserId)
      .SortBy(c => c.Name)
      .ToListAsync();

    var incomeRecords = await IncomeRecords
      .Find(i => i.BudgetMonthId == budgetMonth.Id &&
                 i.UserId == budgetMonth.UserId)
      .SortByDescending(i => i.IncomeDate)
      .ToListAsync();

    var expenseRecords = await ExpenseRecords
      .Find(e => e.BudgetMonthId == budgetMonth.Id &&
                 e.UserId == budgetMonth.UserId)
      .SortByDescending(e => e.ExpenseDate)
      .ToListAsync();

    /*---------------------------------------------------------
      Calculate actual totals
    ---------------------------------------------------------*/
    var totalIncome = incomeRecords.Sum(i => i.Amount);
    var totalExpenses = expenseRecords.Sum(e => e.Amount);

    /*---------------------------------------------------------
      Calculate planned category totals
    ---------------------------------------------------------*/
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

    /*---------------------------------------------------------
      Build and return response
    ---------------------------------------------------------*/
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

      BudgetCategories = budgetCategories
        .Select(c => BudgetCategoryMapper.ToResponse(c, expenseRecords))
        .ToList(),

      IncomeRecords = incomeRecords
        .Select(IncomeMapper.ToResponse)
        .ToList(),

      ExpenseRecords = expenseRecords
        .Select(ExpenseMapper.ToResponse)
        .ToList(),

      CreatedAtUtc = budgetMonth.CreatedAtUtc
    };
  }
}