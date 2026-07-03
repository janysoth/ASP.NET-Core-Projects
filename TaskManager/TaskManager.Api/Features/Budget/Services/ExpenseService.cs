using MongoDB.Driver;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Mappers;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

public class ExpenseService : BudgetBaseService
{
  /*===========================================================
    ExpenseService Constructor
  ===========================================================*/
  public ExpenseService(IMongoDatabase database)
    : base(database)
  {
  }

  /*===========================================================
    AddExpenseAsync
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