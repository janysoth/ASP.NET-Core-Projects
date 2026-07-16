using MongoDB.Driver;
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

    var normalizedType = NormalizeCategoryType(request.Type);

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
    => Clears ExpenseType when changing to Savings or Debt.
    => Returns the updated category response.
  ===========================================================*/
  public async Task<BudgetCategoryResponse?>
    UpdateBudgetCategoryAsync(
      string categoryId,
      UpdateBudgetCategoryRequest request,
      string userId)
  {
    var existingCategory = await BudgetCategories
      .Find(c =>
        c.Id == categoryId &&
        c.UserId == userId)
      .FirstOrDefaultAsync();

    if (existingCategory == null)
    {
      return null;
    }

    var normalizedType = NormalizeCategoryType(request.Type);

    var normalizedExpenseType =
      NormalizeExpenseType(
        normalizedType,
        request.ExpenseType);

    var normalizedName = request.Name.Trim();

    var update = Builders<BudgetCategory>.Update
      .Set(c => c.Name, normalizedName)
      .Set(c => c.Type, normalizedType)
      .Set(c => c.ExpenseType, normalizedExpenseType)
      .Set(c => c.PlannedAmount, request.PlannedAmount);

    var result = await BudgetCategories.UpdateOneAsync(
      c =>
        c.Id == categoryId &&
        c.UserId == userId,
      update);

    if (result.MatchedCount == 0)
    {
      return null;
    }

    /*
      Expenses currently use the category name as a string.

      If the category name changes, update matching expenses so
      planned-versus-actual calculations stay connected.
    */
    if (!string.Equals(
      existingCategory.Name,
      normalizedName,
      StringComparison.OrdinalIgnoreCase))
    {
      var expenseUpdate = Builders<ExpenseRecord>.Update
        .Set(e => e.Category, normalizedName);

      await ExpenseRecords.UpdateManyAsync(
        e =>
          e.UserId == userId &&
          e.BudgetMonthId == existingCategory.BudgetMonthId &&
          e.Category == existingCategory.Name,
        expenseUpdate);
    }

    var updatedCategory = await BudgetCategories
      .Find(c =>
        c.Id == categoryId &&
        c.UserId == userId)
      .FirstOrDefaultAsync();

    if (updatedCategory == null)
    {
      return null;
    }

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
    => Does not delete existing expenses assigned to its name.
    => Returns the deleted category information.
  ===========================================================*/
  public async Task<BudgetCategoryResponse?>
    DeleteBudgetCategoryAsync(
      string categoryId,
      string userId)
  {
    var category = await BudgetCategories
      .Find(c =>
        c.Id == categoryId &&
        c.UserId == userId)
      .FirstOrDefaultAsync();

    if (category == null)
    {
      return null;
    }

    var expenses = await GetExpensesForCategoryAsync(
      category,
      userId);

    var deletedCategory =
      BudgetCategoryMapper.ToResponse(
        category,
        expenses);

    var result = await BudgetCategories.DeleteOneAsync(
      c =>
        c.Id == categoryId &&
        c.UserId == userId);

    if (result.DeletedCount == 0)
    {
      return null;
    }

    return deletedCategory;
  }

  /*===========================================================
    GetExpensesForCategoryAsync:
    => Gets expenses that belong to the category's budget month.
    => Matches expenses by category name.
  ===========================================================*/
  private async Task<List<ExpenseRecord>>
    GetExpensesForCategoryAsync(
      BudgetCategory category,
      string userId)
  {
    return await ExpenseRecords
      .Find(e =>
        e.BudgetMonthId == category.BudgetMonthId &&
        e.UserId == userId &&
        e.Category.ToLower() ==
          category.Name.ToLower())
      .ToListAsync();
  }

  /*===========================================================
    NormalizeCategoryType:
    => Converts category types into consistent stored values.
  ===========================================================*/
  private static string NormalizeCategoryType(string type)
  {
    if (type.Equals(
      "Savings",
      StringComparison.OrdinalIgnoreCase))
    {
      return "Savings";
    }

    if (type.Equals(
      "Debt",
      StringComparison.OrdinalIgnoreCase))
    {
      return "Debt";
    }

    return "Expense";
  }

  /*===========================================================
    NormalizeExpenseType:
    => Stores Fixed or Variable only for Expense categories.
    => Returns null for Savings and Debt categories.
  ===========================================================*/
  private static string? NormalizeExpenseType(
    string categoryType,
    string? expenseType)
  {
    if (!categoryType.Equals(
      "Expense",
      StringComparison.OrdinalIgnoreCase))
    {
      return null;
    }

    return expenseType?.Equals(
      "Fixed",
      StringComparison.OrdinalIgnoreCase) == true
        ? "Fixed"
        : "Variable";
  }
}