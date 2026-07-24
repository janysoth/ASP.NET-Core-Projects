using MongoDB.Driver;
using TaskManager.Api.Features.Budget.Constants;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Mappers;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

public class BudgetCategoryService : BudgetBaseService
{
  /*===========================================================
    BudgetCategoryService Constructor:
    => Receives the shared MongoDB database.
    => Passes the database to BudgetBaseService.
  ===========================================================*/
  public BudgetCategoryService(
    IMongoDatabase database) : base(database)
  {
  }

  /*===========================================================
    AddBudgetCategoryAsync:
    => Creates a budget category for a budget month.
    => Stores Fixed or Variable only for Expense categories.
    => Returns the newly created category response.
  ===========================================================*/
  public async Task<BudgetCategoryResponse?> AddBudgetCategoryAsync(
    string budgetMonthId,
    CreateBudgetCategoryRequest request,
    string userId)
  {
    var budgetMonthExists = await BudgetMonthExistsAsync(
      budgetMonthId,
      userId);

    if (!budgetMonthExists)
    {
      return null;
    }

    var normalizedType =
      NormalizeCategoryType(request.Type);

    var normalizedExpenseType =
      NormalizeExpenseType(
        normalizedType,
        request.ExpenseType);

    var category = new BudgetCategory
    {
      UserId = userId,
      BudgetMonthId = budgetMonthId,
      Name = request.Name.Trim(),
      Type = normalizedType,
      ExpenseType = normalizedExpenseType,
      PlannedAmount = request.PlannedAmount,
      CreatedAtUtc = DateTime.UtcNow
    };

    await BudgetCategories.InsertOneAsync(category);

    var expenses = await GetExpensesForCategoryAsync(
      category,
      userId);

    return BudgetCategoryMapper.ToResponse(
      category,
      expenses);
  }

  /*===========================================================
    UpdateBudgetCategoryAsync:
    => Updates category name, type, classification, and amount.
    => Clears ExpenseType when changing to Savings.
    => Expenses remain connected through CategoryId.
    => Returns the updated category response.
  ===========================================================*/
  public async Task<BudgetCategoryResponse?>
    UpdateBudgetCategoryAsync(
      string categoryId,
      UpdateBudgetCategoryRequest request,
      string userId)
  {
    // Find the existing category and confirm ownership.
    var existingCategory =
      await GetCategoryByIdAsync(
        categoryId,
        userId);

    if (existingCategory is null)
    {
      return null;
    }

    var normalizedType =
      NormalizeCategoryType(request.Type);

    var normalizedExpenseType =
      NormalizeExpenseType(
        normalizedType,
        request.ExpenseType);

    var normalizedName =
      request.Name.Trim();

    // Build the category update.
    var update = Builders<BudgetCategory>.Update
      .Set(
        category => category.Name,
        normalizedName)
      .Set(
        category => category.Type,
        normalizedType)
      .Set(
        category => category.ExpenseType,
        normalizedExpenseType)
      .Set(
        category => category.PlannedAmount,
        request.PlannedAmount);

    // Update the category.
    var updatedCategory =
      await BudgetCategories.FindOneAndUpdateAsync(
        category =>
          category.Id == categoryId &&
          category.UserId == userId,
        update,
        new FindOneAndUpdateOptions<BudgetCategory>
        {
          ReturnDocument = ReturnDocument.After
        });

    if (updatedCategory is null)
    {
      return null;
    }

    /*
      IMPORTANT:

      Expenses now store CategoryId instead of the category name.

      Because of that, renaming the category does NOT require
      updating any ExpenseRecord documents.

      Example:

      Before rename:
        Category Id   = abc123
        Category Name = Groceries

      After rename:
        Category Id   = abc123
        Category Name = Food & Groceries

      Every expense still stores:
        CategoryId = abc123

      Therefore, the relationship remains intact automatically.
    */

    var expenses = await GetExpensesForCategoryAsync(
      updatedCategory,
      userId);

    return BudgetCategoryMapper.ToResponse(
      updatedCategory,
      expenses);
  }

  /*===========================================================
    DeleteBudgetCategoryAsync:
    => Deletes a budget category owned by the logged-in user.
    => Returns the deleted category information.
    => Existing expenses are not deleted automatically.
  ===========================================================*/
  public async Task<BudgetCategoryResponse?>
    DeleteBudgetCategoryAsync(
      string categoryId,
      string userId)
  {
    // Find the category before deleting it.
    var category =
      await GetCategoryByIdAsync(
        categoryId,
        userId);

    if (category is null)
    {
      return null;
    }

    // Load the expenses currently assigned to the category.
    var expenses = await GetExpensesForCategoryAsync(
      category,
      userId);

    // Build the response before deleting the category.
    var deletedCategory =
      BudgetCategoryMapper.ToResponse(
        category,
        expenses);

    // Delete the category.
    var result = await BudgetCategories.DeleteOneAsync(
      existingCategory =>
        existingCategory.Id == categoryId &&
        existingCategory.UserId == userId);

    if (result.DeletedCount == 0)
    {
      return null;
    }

    return deletedCategory;
  }

  /*===========================================================
    GetExpensesForCategoryAsync:
    => Gets expenses assigned to the selected category.
    => Matches expenses using CategoryId.
    => Also confirms budget month and user ownership.
  ===========================================================*/
  private async Task<List<ExpenseRecord>>
    GetExpensesForCategoryAsync(
      BudgetCategory category,
      string userId)
  {
    return await ExpenseRecords
      .Find(expense =>
        expense.UserId == userId &&
        expense.BudgetMonthId == category.BudgetMonthId &&
        expense.CategoryId == category.Id)
      .ToListAsync();
  }

  /*===========================================================
    NormalizeCategoryType:
    => Converts category types into consistent stored values.
    => Supported values are Expense and Savings.
    => Defaults to Expense when the value is invalid.
  ===========================================================*/
  private static string NormalizeCategoryType(
    string type)
  {
    return BudgetCategoryTypes.Normalize(type)
      ?? BudgetCategoryTypes.Expense;
  }

  /*===========================================================
    NormalizeExpenseType:
    => Stores Fixed or Variable only for Expense categories.
    => Returns null for Savings categories.
  ===========================================================*/
  private static string? NormalizeExpenseType(
    string categoryType,
    string? expenseType)
  {
    if (!string.Equals(
      categoryType,
      BudgetCategoryTypes.Expense,
      StringComparison.OrdinalIgnoreCase))
    {
      return null;
    }

    return ExpenseTypes.Normalize(expenseType);
  }
}