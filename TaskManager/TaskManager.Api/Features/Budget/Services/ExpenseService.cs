using MongoDB.Driver;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Mappers;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

/*===========================================================
  ExpenseService
-------------------------------------------------------------
  Purpose:
    => Manages expense records for the Budget module.

  Why:
    => Keeps expense-related business logic separate from
       budget month, category, income, account, and transfer logic.

  Responsibilities:
    => Add expense records.
    => Update expense records.
    => Partially update expense records.
    => Delete expense records.
    => Validate related budget months and financial accounts.

  Inherits:
    => BudgetBaseService
===========================================================*/
public class ExpenseService : BudgetBaseService
{
  /*===========================================================
    ExpenseService Constructor
  -------------------------------------------------------------
    Purpose:
      => Creates an instance of ExpenseService.

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
  public ExpenseService(IMongoDatabase database)
    : base(database)
  {
  }

  /*===========================================================
    AddExpenseAsync
  -------------------------------------------------------------
    Purpose:
      => Adds a new expense record to an existing budget month.

    Why:
      => Allows the user to track money spent for a specific
         monthly budget.

    Parameters:
      => budgetMonthId
         The budget month id where the expense record will be added.

      => request
         Data sent from the frontend to create the expense record.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => ExpenseResponse?

         The created expense response if successful.
         null if the budget month or financial account is invalid.

    Business Rules:
      => Expense can only be added to an existing budget month.
      => The budget month must belong to the current user.
      => The financial account must belong to the current user.
      => CreatedAtUtc is set by the backend.

    MongoDB Operations:
      => Find(BudgetMonths)
      => FirstOrDefaultAsync()
      => Find(FinancialAccounts)
      => FirstOrDefaultAsync()
      => InsertOneAsync(ExpenseRecords)

    Validation:
      => Uses BudgetMonthExistsAsync() to verify the parent
         budget month.
      => Uses AccountExistsAsync() to verify the selected
         financial account.

    Process Overview:
      1. Check if the budget month exists for the current user.
      2. Check if the selected financial account exists.
      3. Return null if either validation fails.
      4. Create a new ExpenseRecord model.
      5. Save the expense record to MongoDB.
      6. Map and return the expense response.

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
  public async Task<ExpenseResponse?> AddExpenseAsync(
    string budgetMonthId,
    CreateExpenseRequest request,
    string userId)
  {
    /*---------------------------------------------------------
      Validate parent budget month and account
    ---------------------------------------------------------*/

    var budgetMonthExists = await BudgetMonthExistsAsync(
      budgetMonthId,
      userId);

    var accountExists = await AccountExistsAsync(
      request.AccountId,
      userId);

    if (!budgetMonthExists || !accountExists)
    {
      return null;
    }

    /*---------------------------------------------------------
      Create new expense model
    ---------------------------------------------------------*/

    var expense = new ExpenseRecord
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

    /*---------------------------------------------------------
      Save expense to MongoDB
    ---------------------------------------------------------*/

    await ExpenseRecords.InsertOneAsync(expense);

    /*---------------------------------------------------------
      Return response
    ---------------------------------------------------------*/

    return ExpenseMapper.ToResponse(expense);
  }

  /*===========================================================
    UpdateExpenseAsync
  -------------------------------------------------------------
    Purpose:
      => Fully updates an existing expense record.

    Why:
      => Allows the user to replace all editable fields of an
         expense record in one request.

    Parameters:
      => expenseId
         The expense record id being updated.

      => request
         Data sent from the frontend with updated expense values.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => ExpenseResponse?

         The updated expense response if successful.
         null if the expense record or selected account is invalid.

    Business Rules:
      => User can only update their own expense record.
      => The selected financial account must belong to the user.
      => AccountId, Category, Name, Amount, ExpenseDate, and Notes
         are updated by this method.

    MongoDB Operations:
      => Find(FinancialAccounts)
      => FirstOrDefaultAsync()
      => Builders<ExpenseRecord>.Update
      => UpdateOneAsync(ExpenseRecords)
      => Find(ExpenseRecords)
      => FirstOrDefaultAsync()

    Validation:
      => Uses AccountExistsAsync() to verify the selected account.
      => Uses expenseId and userId in the update filter to verify
         expense ownership.
      => Returns null if MongoDB does not match any document.

    Process Overview:
      1. Check if the selected financial account exists.
      2. Return null if the account is invalid.
      3. Build the MongoDB update definition.
      4. Update the matching expense record.
      5. Return null if no expense record was matched.
      6. Reload the updated expense record.
      7. Map and return the updated expense response.

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
  public async Task<ExpenseResponse?> UpdateExpenseAsync(
    string expenseId,
    UpdateExpenseRequest request,
    string userId)
  {
    /*---------------------------------------------------------
      Validate selected financial account
    ---------------------------------------------------------*/

    var accountExists = await AccountExistsAsync(
      request.AccountId,
      userId);

    if (!accountExists)
    {
      return null;
    }

    /*---------------------------------------------------------
      Build update definition
    ---------------------------------------------------------*/

    var update = Builders<ExpenseRecord>.Update
      .Set(e => e.AccountId, request.AccountId)
      .Set(e => e.Category, request.Category)
      .Set(e => e.Name, request.Name)
      .Set(e => e.Amount, request.Amount)
      .Set(e => e.ExpenseDate, request.ExpenseDate)
      .Set(e => e.Notes, request.Notes);

    /*---------------------------------------------------------
      Update expense in MongoDB
    ---------------------------------------------------------*/

    var result = await ExpenseRecords.UpdateOneAsync(
      e => e.Id == expenseId && e.UserId == userId,
      update);

    if (result.MatchedCount == 0)
    {
      return null;
    }

    /*---------------------------------------------------------
      Reload and return updated expense
    ---------------------------------------------------------*/

    var updatedExpense = await ExpenseRecords
      .Find(e => e.Id == expenseId && e.UserId == userId)
      .FirstOrDefaultAsync();

    return updatedExpense == null
      ? null
      : ExpenseMapper.ToResponse(updatedExpense);
  }

  /*===========================================================
    PatchExpenseAsync
  -------------------------------------------------------------
    Purpose:
      => Partially updates an existing expense record.

    Why:
      => Allows the user to update only the fields they changed
         instead of sending the full expense object.

    Parameters:
      => expenseId
         The expense record id being patched.

      => request
         Data sent from the frontend with optional updated fields.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => ExpenseResponse?

         The updated expense response if successful.
         The original expense response if no fields were provided.
         null if the expense record or selected account is invalid.

    Business Rules:
      => User can only patch their own expense record.
      => Only fields included in the patch request are updated.
      => If AccountId is included, it must belong to the user.
      => If no update fields are provided, the existing expense
         response is returned without modifying MongoDB.

    MongoDB Operations:
      => Find(ExpenseRecords)
      => FirstOrDefaultAsync()
      => Find(FinancialAccounts)
      => FirstOrDefaultAsync()
      => Builders<ExpenseRecord>.Update.Set()
      => Builders<ExpenseRecord>.Update.Combine()
      => UpdateOneAsync(ExpenseRecords)

    Validation:
      => Finds the expense record before patching.
      => Validates AccountId only when AccountId is included.
      => Returns null if the expense record is not found.
      => Returns null if the provided AccountId is invalid.

    Process Overview:
      1. Find the existing expense record.
      2. Return null if the expense record is not found.
      3. Create an empty update definition list.
      4. Add update definitions only for provided fields.
      5. Validate AccountId if it was provided.
      6. Return the original response if no updates were provided.
      7. Combine all update definitions.
      8. Update the expense record in MongoDB.
      9. Reload and return the updated expense response.

    Concepts Used:
      ✓ Async / Await
      ✓ MongoDB Driver
      ✓ Patch Pattern
      ✓ Optional Properties
      ✓ UpdateDefinition<T>
      ✓ Update.Combine()
      ✓ List<T>
      ✓ HasValue
      ✓ Guard Clause
      ✓ DTO Pattern
      ✓ Mapper Pattern
      ✓ Ownership Validation
  ===========================================================*/
  public async Task<ExpenseResponse?> PatchExpenseAsync(
    string expenseId,
    PatchExpenseRequest request,
    string userId)
  {
    /*---------------------------------------------------------
      Find existing expense before patching
    ---------------------------------------------------------*/

    var expense = await ExpenseRecords
      .Find(e => e.Id == expenseId && e.UserId == userId)
      .FirstOrDefaultAsync();

    if (expense == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Build update list from provided fields
    ---------------------------------------------------------*/

    var updates = new List<UpdateDefinition<ExpenseRecord>>();

    if (request.AccountId != null)
    {
      var accountExists = await AccountExistsAsync(
        request.AccountId,
        userId);

      if (!accountExists)
      {
        return null;
      }

      updates.Add(
        Builders<ExpenseRecord>.Update.Set(
          e => e.AccountId,
          request.AccountId));
    }

    if (request.Category != null)
    {
      updates.Add(
        Builders<ExpenseRecord>.Update.Set(
          e => e.Category,
          request.Category));
    }

    if (request.Name != null)
    {
      updates.Add(
        Builders<ExpenseRecord>.Update.Set(
          e => e.Name,
          request.Name));
    }

    if (request.Amount.HasValue)
    {
      updates.Add(
        Builders<ExpenseRecord>.Update.Set(
          e => e.Amount,
          request.Amount.Value));
    }

    if (request.ExpenseDate.HasValue)
    {
      updates.Add(
        Builders<ExpenseRecord>.Update.Set(
          e => e.ExpenseDate,
          request.ExpenseDate.Value));
    }

    if (request.Notes != null)
    {
      updates.Add(
        Builders<ExpenseRecord>.Update.Set(
          e => e.Notes,
          request.Notes));
    }

    /*---------------------------------------------------------
      Return existing response when nothing changed
    ---------------------------------------------------------*/

    if (updates.Count == 0)
    {
      return ExpenseMapper.ToResponse(expense);
    }

    /*---------------------------------------------------------
      Apply combined update to MongoDB
    ---------------------------------------------------------*/

    await ExpenseRecords.UpdateOneAsync(
      e => e.Id == expenseId && e.UserId == userId,
      Builders<ExpenseRecord>.Update.Combine(updates));

    /*---------------------------------------------------------
      Reload and return updated expense
    ---------------------------------------------------------*/

    var updatedExpense = await ExpenseRecords
      .Find(e => e.Id == expenseId && e.UserId == userId)
      .FirstOrDefaultAsync();

    return updatedExpense == null
      ? null
      : ExpenseMapper.ToResponse(updatedExpense);
  }

  /*===========================================================
    DeleteExpenseAsync
  -------------------------------------------------------------
    Purpose:
      => Deletes an existing expense record.

    Why:
      => Allows the user to remove incorrect or unwanted expense
         entries from their budget month.

    Parameters:
      => expenseId
         The expense record id being deleted.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => ExpenseResponse?

         The deleted expense response if successful.
         null if the expense record does not exist or does not
         belong to the current user.

    Business Rules:
      => User can only delete their own expense record.
      => The expense response is built from the record before
         deletion.
      => Deleting expenses affects calculated budget totals when
         the budget month is loaded again.

    MongoDB Operations:
      => Find(ExpenseRecords)
      => FirstOrDefaultAsync()
      => DeleteOneAsync(ExpenseRecords)

    Validation:
      => Searches by expenseId and userId before deleting.
      => Returns null if the expense record is not found.

    Process Overview:
      1. Find the expense record by expenseId and userId.
      2. Return null if the expense record is not found.
      3. Delete the expense record from MongoDB.
      4. Return the deleted expense response.

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
  public async Task<ExpenseResponse?> DeleteExpenseAsync(
    string expenseId,
    string userId)
  {
    /*---------------------------------------------------------
      Find expense before deleting
    ---------------------------------------------------------*/

    var expense = await ExpenseRecords
      .Find(e => e.Id == expenseId && e.UserId == userId)
      .FirstOrDefaultAsync();

    if (expense == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Delete expense from MongoDB
    ---------------------------------------------------------*/

    await ExpenseRecords.DeleteOneAsync(
      e => e.Id == expenseId && e.UserId == userId);

    /*---------------------------------------------------------
      Return deleted expense response
    ---------------------------------------------------------*/

    return ExpenseMapper.ToResponse(expense);
  }
}