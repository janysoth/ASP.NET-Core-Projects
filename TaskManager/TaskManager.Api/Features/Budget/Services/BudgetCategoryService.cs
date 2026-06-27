using MongoDB.Driver;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Mappers;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

/*===========================================================
  BudgetCategoryService
-------------------------------------------------------------
  Purpose:
    => Manages budget category records for the Budget module.

  Why:
    => Keeps category-related business logic separate from
       budget month, income, expense, account, and transfer logic.

  Responsibilities:
    => Add a category to a budget month.
    => Update an existing category.
    => Delete an existing category.
    => Calculate category spending using related expense records.

  Inherits:
    => BudgetBaseService
===========================================================*/
public class BudgetCategoryService : BudgetBaseService
{
  /*===========================================================
    BudgetCategoryService Constructor
  -------------------------------------------------------------
    Purpose:
      => Creates an instance of BudgetCategoryService.

    Why:
      => Receives the MongoDB database through dependency
         injection and passes it to BudgetBaseService.

    Parameters:
      => database
         MongoDB database connection provided by Program.cs.

    Process Overview:
      1. Receive IMongoDatabase.
      2. Pass database to BudgetBaseService.
      3. BudgetBaseService initializes shared collections.

    Concepts Used:
      ✓ Dependency Injection
      ✓ Constructor Chaining
      ✓ Inheritance
  ===========================================================*/
  public BudgetCategoryService(IMongoDatabase database)
    : base(database)
  {
  }

  /*===========================================================
    AddBudgetCategoryAsync
  -------------------------------------------------------------
    Purpose:
      => Adds a new budget category to an existing budget month.

    Why:
      => Allows the user to plan where their money should go
         for a specific month.

    Parameters:
      => budgetMonthId
         The budget month id where the category will be added.

      => request
         Data sent from the frontend to create the category.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => BudgetCategoryResponse?

         The created category response if successful.
         null if the budget month does not exist or does not
         belong to the current user.

    Business Rules:
      => A category can only be added to an existing budget month.
      => The budget month must belong to the current user.
      => The created category belongs to the current user.
      => CreatedAtUtc is set by the backend.

    MongoDB Operations:
      => Find(BudgetMonths)
      => FirstOrDefaultAsync()
      => InsertOneAsync(BudgetCategories)
      => Find(ExpenseRecords)
      => ToListAsync()

    Validation:
      => Uses BudgetMonthExistsAsync() to verify the parent
         budget month before creating the category.

    Process Overview:
      1. Check if the budget month exists for the current user.
      2. Return null if the budget month is invalid.
      3. Create a new BudgetCategory model.
      4. Save the category to MongoDB.
      5. Get matching expenses for the category.
      6. Map and return the category response.

    Concepts Used:
      ✓ Async / Await
      ✓ MongoDB Driver
      ✓ InsertOneAsync()
      ✓ DTO Pattern
      ✓ Mapper Pattern
      ✓ Object Initializer
      ✓ Guard Clause
      ✓ Ownership Validation
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
  -------------------------------------------------------------
    Purpose:
      => Updates an existing budget category.

    Why:
      => Allows the user to rename a category, change its type,
         or adjust the planned amount.

    Parameters:
      => categoryId
         The budget category id being updated.

      => request
         Data sent from the frontend with updated category values.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => BudgetCategoryResponse?

         The updated category response if successful.
         null if the category does not exist or does not belong
         to the current user.

    Business Rules:
      => User can only update their own category.
      => Name, Type, and PlannedAmount are updated by this method.
      => Category response includes matching expenses after update.

    MongoDB Operations:
      => Builders<BudgetCategory>.Update
      => UpdateOneAsync(BudgetCategories)
      => Find(BudgetCategories)
      => FirstOrDefaultAsync()
      => Find(ExpenseRecords)
      => ToListAsync()

    Validation:
      => Uses categoryId and userId in the update filter to
         verify ownership.
      => Returns null if MongoDB does not match any document.

    Process Overview:
      1. Build the MongoDB update definition.
      2. Update the matching category by categoryId and userId.
      3. Return null if no category was matched.
      4. Reload the updated category.
      5. Return null if the category cannot be found.
      6. Get matching expenses for the category.
      7. Map and return the updated response.

    Concepts Used:
      ✓ Async / Await
      ✓ MongoDB Driver
      ✓ Update Definition
      ✓ UpdateOneAsync()
      ✓ MatchedCount
      ✓ FirstOrDefaultAsync()
      ✓ DTO Pattern
      ✓ Mapper Pattern
      ✓ Ownership Validation
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
  -------------------------------------------------------------
    Purpose:
      => Deletes an existing budget category.

    Why:
      => Allows the user to remove a category they no longer
         want in their budget plan.

    Parameters:
      => categoryId
         The budget category id being deleted.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => BudgetCategoryResponse?

         The deleted category response if successful.
         null if the category does not exist or does not belong
         to the current user.

    Business Rules:
      => User can only delete their own category.
      => The response is built from the category before deletion.
      => Matching expense records are not deleted by this method.
         They are only used to calculate the deleted response.

    MongoDB Operations:
      => Find(BudgetCategories)
      => FirstOrDefaultAsync()
      => Find(ExpenseRecords)
      => ToListAsync()
      => DeleteOneAsync(BudgetCategories)

    Validation:
      => Searches by categoryId and userId before deleting.
      => Returns null if the category is not found.

    Process Overview:
      1. Find the category by categoryId and userId.
      2. Return null if the category is not found.
      3. Get matching expenses for response calculations.
      4. Delete the category from MongoDB.
      5. Return the deleted category response.

    Concepts Used:
      ✓ Async / Await
      ✓ MongoDB Driver
      ✓ Find()
      ✓ FirstOrDefaultAsync()
      ✓ DeleteOneAsync()
      ✓ DTO Pattern
      ✓ Mapper Pattern
      ✓ Guard Clause
      ✓ Ownership Validation
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
  -------------------------------------------------------------
    Purpose:
      => Gets all expense records that belong to a specific
         budget category.

    Why:
      => Allows the service to calculate how much has been
         spent inside a category.

    Parameters:
      => category
         The category used to match related expense records.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => List<ExpenseRecord>

         Expense records from the same budget month where the
         expense category name matches the budget category name.

    Business Rules:
      => Expenses must belong to the same budget month.
      => Expenses must belong to the current user.
      => Expense category name must match the budget category name.
      => Category matching is case-insensitive.

    MongoDB Operations:
      => Find(ExpenseRecords)
      => ToListAsync()

    Used By:
      => AddBudgetCategoryAsync()
      => UpdateBudgetCategoryAsync()
      => DeleteBudgetCategoryAsync()

    Process Overview:
      1. Search ExpenseRecords by budget month id.
      2. Filter by current user id.
      3. Match expense category name to budget category name.
      4. Return the matching expense list.

    Concepts Used:
      ✓ Async / Await
      ✓ MongoDB Driver
      ✓ Find()
      ✓ ToListAsync()
      ✓ Lambda Expressions
      ✓ Helper Method
      ✓ Case-Insensitive Matching
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