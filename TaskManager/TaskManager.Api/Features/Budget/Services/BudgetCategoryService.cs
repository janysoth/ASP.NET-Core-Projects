using MongoDB.Driver;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Mappers;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

public class BudgetCategoryService : BudgetBaseService
{
  /*===========================================================
    BudgetCategoryService Constructor
  ===========================================================*/
  public BudgetCategoryService(IMongoDatabase database)
    : base(database)
  {
  }

  /*===========================================================
    AddBudgetCategoryAsync
  ===========================================================*/
  public async Task<BudgetCategoryResponse?> AddBudgetCategoryAsync(
    string budgetMonthId,
    CreateBudgetCategoryRequest request,
    string userId)
  {
    /*---------------------------------------------------------
      Validate parent budget month
    ---------------------------------------------------------*/
    var budgetMonthExists = await BudgetMonthExistsAsync(
      budgetMonthId,
      userId);

    if (!budgetMonthExists)
    {
      return null;
    }

    /*---------------------------------------------------------
      Create new category model
    ---------------------------------------------------------*/
    var category = new BudgetCategory
    {
      UserId = userId,
      BudgetMonthId = budgetMonthId,
      Name = request.Name,
      Type = request.Type,
      PlannedAmount = request.PlannedAmount,
      CreatedAtUtc = DateTime.UtcNow
    };

    /*---------------------------------------------------------
      Save category to MongoDB
    ---------------------------------------------------------*/
    await BudgetCategories.InsertOneAsync(category);

    /*---------------------------------------------------------
      Build and return response
    ---------------------------------------------------------*/
    var expenses = await GetExpensesForCategoryAsync(category, userId);

    return BudgetCategoryMapper.ToResponse(category, expenses);
  }

  /*===========================================================
    UpdateBudgetCategoryAsync
  ===========================================================*/
  public async Task<BudgetCategoryResponse?> UpdateBudgetCategoryAsync(
    string categoryId,
    UpdateBudgetCategoryRequest request,
    string userId)
  {
    /*---------------------------------------------------------
      Build update definition
    ---------------------------------------------------------*/
    var update = Builders<BudgetCategory>.Update
      .Set(c => c.Name, request.Name)
      .Set(c => c.Type, request.Type)
      .Set(c => c.PlannedAmount, request.PlannedAmount);

    /*---------------------------------------------------------
      Update category in MongoDB
    ---------------------------------------------------------*/
    var result = await BudgetCategories.UpdateOneAsync(
      c => c.Id == categoryId && c.UserId == userId,
      update);

    if (result.MatchedCount == 0)
    {
      return null;
    }

    /*---------------------------------------------------------
      Reload updated category
    ---------------------------------------------------------*/
    var category = await BudgetCategories
      .Find(c => c.Id == categoryId && c.UserId == userId)
      .FirstOrDefaultAsync();

    if (category == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Build and return response
    ---------------------------------------------------------*/
    var expenses = await GetExpensesForCategoryAsync(category, userId);

    return BudgetCategoryMapper.ToResponse(category, expenses);
  }

  /*===========================================================
    DeleteBudgetCategoryAsync
  ===========================================================*/
  public async Task<BudgetCategoryResponse?> DeleteBudgetCategoryAsync(
    string categoryId,
    string userId)
  {
    /*---------------------------------------------------------
      Find category before deleting
    ---------------------------------------------------------*/
    var category = await BudgetCategories
      .Find(c => c.Id == categoryId && c.UserId == userId)
      .FirstOrDefaultAsync();

    if (category == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Get expenses before category is removed
    ---------------------------------------------------------*/
    var expenses = await GetExpensesForCategoryAsync(category, userId);

    /*---------------------------------------------------------
      Delete category from MongoDB
    ---------------------------------------------------------*/
    await BudgetCategories.DeleteOneAsync(
      c => c.Id == categoryId && c.UserId == userId);

    /*---------------------------------------------------------
      Return deleted category response
    ---------------------------------------------------------*/
    return BudgetCategoryMapper.ToResponse(category, expenses);
  }

  /*===========================================================
    GetExpensesForCategoryAsync
  ===========================================================*/
  private async Task<List<ExpenseRecord>> GetExpensesForCategoryAsync(
    BudgetCategory category,
    string userId)
  {
    return await ExpenseRecords
      .Find(e =>
        e.BudgetMonthId == category.BudgetMonthId &&
        e.UserId == userId &&
        e.Category.ToLower() == category.Name.ToLower())
      .ToListAsync();
  }
}