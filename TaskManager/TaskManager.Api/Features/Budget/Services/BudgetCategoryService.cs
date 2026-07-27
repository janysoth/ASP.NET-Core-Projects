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

    Budget Rules:

    Fixed Expense:
    => Effective planned budget will come from linked
       Bill.ExpectedAmount values.

    Variable Expense:
    => Effective planned budget comes from PlannedAmount.

    Savings:
    => Effective planned budget comes from PlannedAmount.
  ===========================================================*/
  public async Task<BudgetCategoryResponse?> AddBudgetCategoryAsync(
    string budgetMonthId,
    CreateBudgetCategoryRequest request,
    string userId)
  {
    var budgetMonthExists =
      await BudgetMonthExistsAsync(
        budgetMonthId,
        userId);

    if (!budgetMonthExists)
    {
      return null;
    }

    var normalizedType =
      NormalizeCategoryType(
        request.Type);

    var normalizedExpenseType =
      NormalizeExpenseType(
        normalizedType,
        request.ExpenseType);

    var category =
      new BudgetCategory
      {
        UserId =
          userId,

        BudgetMonthId =
          budgetMonthId,

        Name =
          request.Name.Trim(),

        Type =
          normalizedType,

        ExpenseType =
          normalizedExpenseType,

        PlannedAmount =
          request.PlannedAmount,

        CreatedAtUtc =
          DateTime.UtcNow
      };

    await BudgetCategories.InsertOneAsync(
      category);

    /*
      A newly created category normally has no expenses
      or bills yet.

      We still load both collections so the mapper always
      receives complete information.
    */
    var expenses =
      await GetExpensesForCategoryAsync(
        category,
        userId);

    var bills =
      await GetBillsForCategoryAsync(
        category,
        userId);

    return BudgetCategoryMapper.ToResponse(
      category,
      expenses,
      bills);
  }

  /*===========================================================
    UpdateBudgetCategoryAsync:
    => Updates category name, type, classification, and amount.
    => Clears ExpenseType when changing to Savings.
    => Expenses remain connected through CategoryId.
    => Existing bills remain connected through BudgetCategoryId.
    => Returns the updated category response.

    Important:
    => A category containing fixed Expense bills cannot be
       changed into Savings or Variable while those bills
       still reference the category.
  ===========================================================*/
  public async Task<BudgetCategoryResponse?>
    UpdateBudgetCategoryAsync(
      string categoryId,
      UpdateBudgetCategoryRequest request,
      string userId)
  {
    /*
      Find the existing category and confirm ownership.
    */
    var existingCategory =
      await GetCategoryByIdAsync(
        categoryId,
        userId);

    if (existingCategory is null)
    {
      return null;
    }

    var normalizedType =
      NormalizeCategoryType(
        request.Type);

    var normalizedExpenseType =
      NormalizeExpenseType(
        normalizedType,
        request.ExpenseType);

    var normalizedName =
      request.Name.Trim();

    /*
      Load bills currently using this category.

      Fixed Expense bills depend on their BudgetCategoryId
      remaining connected to a Fixed Expense category.
    */
    var existingBills =
      await GetBillsForCategoryAsync(
        existingCategory,
        userId);

    var hasLinkedBills =
      existingBills.Count > 0;

    /*
      A category with Expense bills must remain:

      Type        = Expense
      ExpenseType = Fixed

      Otherwise those bills would become connected to an
      incompatible category.
    */
    if (hasLinkedBills)
    {
      var remainsExpense =
        string.Equals(
          normalizedType,
          BudgetCategoryTypes.Expense,
          StringComparison.OrdinalIgnoreCase);

      var remainsFixed =
        string.Equals(
          normalizedExpenseType,
          ExpenseTypes.Fixed,
          StringComparison.OrdinalIgnoreCase);

      if (!remainsExpense ||
          !remainsFixed)
      {
        return null;
      }
    }

    /*
      Build the category update.
    */
    var update =
      Builders<BudgetCategory>.Update
        .Set(
          category =>
            category.Name,
          normalizedName)
        .Set(
          category =>
            category.Type,
          normalizedType)
        .Set(
          category =>
            category.ExpenseType,
          normalizedExpenseType)
        .Set(
          category =>
            category.PlannedAmount,
          request.PlannedAmount);

    /*
      Update the category.
    */
    var updatedCategory =
      await BudgetCategories.FindOneAndUpdateAsync(
        category =>
          category.Id == categoryId &&
          category.UserId == userId,
        update,
        new FindOneAndUpdateOptions<BudgetCategory>
        {
          ReturnDocument =
            ReturnDocument.After
        });

    if (updatedCategory is null)
    {
      return null;
    }

    /*
      IMPORTANT:

      Expenses store CategoryId instead of the category name.

      Because of that, renaming the category does NOT require
      changing ExpenseRecord documents.

      Example:

      Before:
        Id   = abc123
        Name = Groceries

      After:
        Id   = abc123
        Name = Food & Groceries

      ExpenseRecord still stores:

        CategoryId = abc123

      The relationship remains intact automatically.

      Bills work the same way because they store:

        BudgetCategoryId = abc123
    */

    var expenses =
      await GetExpensesForCategoryAsync(
        updatedCategory,
        userId);

    var bills =
      await GetBillsForCategoryAsync(
        updatedCategory,
        userId);

    return BudgetCategoryMapper.ToResponse(
      updatedCategory,
      expenses,
      bills);
  }

  /*===========================================================
    DeleteBudgetCategoryAsync:
    => Deletes a budget category owned by the logged-in user.
    => Returns the deleted category information.
    => Existing expenses are not deleted automatically.

    Important:
    => A category cannot be deleted while a bill still
       references it.

       This prevents a Bill from containing an orphaned
       BudgetCategoryId.
  ===========================================================*/
  public async Task<BudgetCategoryResponse?>
    DeleteBudgetCategoryAsync(
      string categoryId,
      string userId)
  {
    /*
      Find the category before deleting it.
    */
    var category =
      await GetCategoryByIdAsync(
        categoryId,
        userId);

    if (category is null)
    {
      return null;
    }

    /*
      Load Expense bills currently linked to this category.
    */
    var bills =
      await GetBillsForCategoryAsync(
        category,
        userId);

    /*
      Do not delete a category that is still being used
      by a bill.

      The bill should be deleted or moved first.
    */
    if (bills.Count > 0)
    {
      return null;
    }

    /*
      Load expenses currently assigned to the category.
    */
    var expenses =
      await GetExpensesForCategoryAsync(
        category,
        userId);

    /*
      Build the response before deleting the category.
    */
    var deletedCategory =
      BudgetCategoryMapper.ToResponse(
        category,
        expenses,
        bills);

    /*
      Delete the category.
    */
    var result =
      await BudgetCategories.DeleteOneAsync(
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
        expense.BudgetMonthId ==
          category.BudgetMonthId &&
        expense.CategoryId ==
          category.Id)
      .ToListAsync();
  }

  /*===========================================================
    GetBillsForCategoryAsync:
    => Gets Expense bills linked to the selected category.
    => Matches using Bill.BudgetCategoryId.
    => Only Expense bills are included.
    => Transfer bills are not part of category spending.
  ===========================================================*/
  private async Task<List<Bill>>
    GetBillsForCategoryAsync(
      BudgetCategory category,
      string userId)
  {
    return await Bills
      .Find(bill =>
        bill.UserId == userId &&
        bill.BudgetMonthId ==
          category.BudgetMonthId &&
        bill.BudgetCategoryId ==
          category.Id &&
        bill.PaymentType ==
          BillPaymentTypes.Expense)
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
    return BudgetCategoryTypes.Normalize(
      type)
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

    return ExpenseTypes.Normalize(
      expenseType);
  }
}