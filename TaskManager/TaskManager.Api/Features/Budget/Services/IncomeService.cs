using MongoDB.Driver;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Mappers;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

/*===========================================================
  IncomeService
-------------------------------------------------------------
  Purpose:
    => Manages income records for the Budget module.

  Why:
    => Keeps income-related business logic separate from
       budget month, category, expense, account, and transfer logic.

  Responsibilities:
    => Add income records.
    => Update income records.
    => Partially update income records.
    => Delete income records.
    => Validate related budget months and financial accounts.

  Inherits:
    => BudgetBaseService
===========================================================*/
public class IncomeService : BudgetBaseService
{
  /*===========================================================
    IncomeService Constructor
  -------------------------------------------------------------
    Purpose:
      => Creates an instance of IncomeService.

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
  public IncomeService(IMongoDatabase database)
    : base(database)
  {
  }

  /*===========================================================
    AddIncomeAsync
  -------------------------------------------------------------
    Purpose:
      => Adds a new income record to an existing budget month.

    Why:
      => Allows the user to track money received for a specific
         monthly budget.

    Parameters:
      => budgetMonthId
         The budget month id where the income record will be added.

      => request
         Data sent from the frontend to create the income record.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => IncomeResponse?

         The created income response if successful.
         null if the budget month or financial account is invalid.

    Business Rules:
      => Income can only be added to an existing budget month.
      => The budget month must belong to the current user.
      => The financial account must belong to the current user.
      => CreatedAtUtc is set by the backend.

    MongoDB Operations:
      => Find(BudgetMonths)
      => FirstOrDefaultAsync()
      => Find(FinancialAccounts)
      => FirstOrDefaultAsync()
      => InsertOneAsync(IncomeRecords)

    Validation:
      => Uses BudgetMonthExistsAsync() to verify the parent
         budget month.
      => Uses AccountExistsAsync() to verify the selected
         financial account.

    Process Overview:
      1. Check if the budget month exists for the current user.
      2. Check if the selected financial account exists.
      3. Return null if either validation fails.
      4. Create a new IncomeRecord model.
      5. Save the income record to MongoDB.
      6. Map and return the income response.

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
  public async Task<IncomeResponse?> AddIncomeAsync(
    string budgetMonthId,
    CreateIncomeRequest request,
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
      Create new income model
    ---------------------------------------------------------*/

    var income = new IncomeRecord
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

    /*---------------------------------------------------------
      Save income to MongoDB
    ---------------------------------------------------------*/

    await IncomeRecords.InsertOneAsync(income);

    /*---------------------------------------------------------
      Return response
    ---------------------------------------------------------*/

    return IncomeMapper.ToResponse(income);
  }

  /*===========================================================
    UpdateIncomeAsync
  -------------------------------------------------------------
    Purpose:
      => Fully updates an existing income record.

    Why:
      => Allows the user to replace all editable fields of an
         income record in one request.

    Parameters:
      => incomeId
         The income record id being updated.

      => request
         Data sent from the frontend with updated income values.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => IncomeResponse?

         The updated income response if successful.
         null if the income record or selected account is invalid.

    Business Rules:
      => User can only update their own income record.
      => The selected financial account must belong to the user.
      => AccountId, Source, Amount, IncomeDate, and Notes are
         updated by this method.

    MongoDB Operations:
      => Find(FinancialAccounts)
      => FirstOrDefaultAsync()
      => Builders<IncomeRecord>.Update
      => UpdateOneAsync(IncomeRecords)
      => Find(IncomeRecords)
      => FirstOrDefaultAsync()

    Validation:
      => Uses AccountExistsAsync() to verify the selected account.
      => Uses incomeId and userId in the update filter to verify
         income ownership.
      => Returns null if MongoDB does not match any document.

    Process Overview:
      1. Check if the selected financial account exists.
      2. Return null if the account is invalid.
      3. Build the MongoDB update definition.
      4. Update the matching income record.
      5. Return null if no income record was matched.
      6. Reload the updated income record.
      7. Map and return the updated income response.

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
  public async Task<IncomeResponse?> UpdateIncomeAsync(
    string incomeId,
    UpdateIncomeRequest request,
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

    var update = Builders<IncomeRecord>.Update
      .Set(i => i.AccountId, request.AccountId)
      .Set(i => i.Source, request.Source)
      .Set(i => i.Amount, request.Amount)
      .Set(i => i.IncomeDate, request.IncomeDate)
      .Set(i => i.Notes, request.Notes);

    /*---------------------------------------------------------
      Update income in MongoDB
    ---------------------------------------------------------*/

    var result = await IncomeRecords.UpdateOneAsync(
      i => i.Id == incomeId && i.UserId == userId,
      update);

    if (result.MatchedCount == 0)
    {
      return null;
    }

    /*---------------------------------------------------------
      Reload and return updated income
    ---------------------------------------------------------*/

    var updatedIncome = await IncomeRecords
      .Find(i => i.Id == incomeId && i.UserId == userId)
      .FirstOrDefaultAsync();

    return updatedIncome == null
      ? null
      : IncomeMapper.ToResponse(updatedIncome);
  }

  /*===========================================================
    PatchIncomeAsync
  -------------------------------------------------------------
    Purpose:
      => Partially updates an existing income record.

    Why:
      => Allows the user to update only the fields they changed
         instead of sending the full income object.

    Parameters:
      => incomeId
         The income record id being patched.

      => request
         Data sent from the frontend with optional updated fields.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => IncomeResponse?

         The updated income response if successful.
         The original income response if no fields were provided.
         null if the income record or selected account is invalid.

    Business Rules:
      => User can only patch their own income record.
      => Only fields included in the patch request are updated.
      => If AccountId is included, it must belong to the user.
      => If no update fields are provided, the existing income
         response is returned without modifying MongoDB.

    MongoDB Operations:
      => Find(IncomeRecords)
      => FirstOrDefaultAsync()
      => Find(FinancialAccounts)
      => FirstOrDefaultAsync()
      => Builders<IncomeRecord>.Update.Set()
      => Builders<IncomeRecord>.Update.Combine()
      => UpdateOneAsync(IncomeRecords)

    Validation:
      => Finds the income record before patching.
      => Validates AccountId only when AccountId is included.
      => Returns null if the income record is not found.
      => Returns null if the provided AccountId is invalid.

    Process Overview:
      1. Find the existing income record.
      2. Return null if the income record is not found.
      3. Create an empty update definition list.
      4. Add update definitions only for provided fields.
      5. Validate AccountId if it was provided.
      6. Return the original response if no updates were provided.
      7. Combine all update definitions.
      8. Update the income record in MongoDB.
      9. Reload and return the updated income response.

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
  public async Task<IncomeResponse?> PatchIncomeAsync(
    string incomeId,
    PatchIncomeRequest request,
    string userId)
  {
    /*---------------------------------------------------------
      Find existing income before patching
    ---------------------------------------------------------*/

    var income = await IncomeRecords
      .Find(i => i.Id == incomeId && i.UserId == userId)
      .FirstOrDefaultAsync();

    if (income == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Build update list from provided fields
    ---------------------------------------------------------*/

    var updates = new List<UpdateDefinition<IncomeRecord>>();

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
        Builders<IncomeRecord>.Update.Set(
          i => i.AccountId,
          request.AccountId));
    }

    if (request.Source != null)
    {
      updates.Add(
        Builders<IncomeRecord>.Update.Set(
          i => i.Source,
          request.Source));
    }

    if (request.Amount.HasValue)
    {
      updates.Add(
        Builders<IncomeRecord>.Update.Set(
          i => i.Amount,
          request.Amount.Value));
    }

    if (request.IncomeDate.HasValue)
    {
      updates.Add(
        Builders<IncomeRecord>.Update.Set(
          i => i.IncomeDate,
          request.IncomeDate.Value));
    }

    if (request.Notes != null)
    {
      updates.Add(
        Builders<IncomeRecord>.Update.Set(
          i => i.Notes,
          request.Notes));
    }

    /*---------------------------------------------------------
      Return existing response when nothing changed
    ---------------------------------------------------------*/

    if (updates.Count == 0)
    {
      return IncomeMapper.ToResponse(income);
    }

    /*---------------------------------------------------------
      Apply combined update to MongoDB
    ---------------------------------------------------------*/

    await IncomeRecords.UpdateOneAsync(
      i => i.Id == incomeId && i.UserId == userId,
      Builders<IncomeRecord>.Update.Combine(updates));

    /*---------------------------------------------------------
      Reload and return updated income
    ---------------------------------------------------------*/

    var updatedIncome = await IncomeRecords
      .Find(i => i.Id == incomeId && i.UserId == userId)
      .FirstOrDefaultAsync();

    return updatedIncome == null
      ? null
      : IncomeMapper.ToResponse(updatedIncome);
  }

  /*===========================================================
    DeleteIncomeAsync
  -------------------------------------------------------------
    Purpose:
      => Deletes an existing income record.

    Why:
      => Allows the user to remove incorrect or unwanted income
         entries from their budget month.

    Parameters:
      => incomeId
         The income record id being deleted.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => IncomeResponse?

         The deleted income response if successful.
         null if the income record does not exist or does not
         belong to the current user.

    Business Rules:
      => User can only delete their own income record.
      => The income response is built from the record before
         deletion.
      => Deleting income affects calculated budget totals when
         the budget month is loaded again.

    MongoDB Operations:
      => Find(IncomeRecords)
      => FirstOrDefaultAsync()
      => DeleteOneAsync(IncomeRecords)

    Validation:
      => Searches by incomeId and userId before deleting.
      => Returns null if the income record is not found.

    Process Overview:
      1. Find the income record by incomeId and userId.
      2. Return null if the income record is not found.
      3. Delete the income record from MongoDB.
      4. Return the deleted income response.

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
  public async Task<IncomeResponse?> DeleteIncomeAsync(
    string incomeId,
    string userId)
  {
    /*---------------------------------------------------------
      Find income before deleting
    ---------------------------------------------------------*/

    var income = await IncomeRecords
      .Find(i => i.Id == incomeId && i.UserId == userId)
      .FirstOrDefaultAsync();

    if (income == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Delete income from MongoDB
    ---------------------------------------------------------*/

    await IncomeRecords.DeleteOneAsync(
      i => i.Id == incomeId && i.UserId == userId);

    /*---------------------------------------------------------
      Return deleted income response
    ---------------------------------------------------------*/

    return IncomeMapper.ToResponse(income);
  }
}