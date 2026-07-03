using MongoDB.Driver;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Mappers;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

public class IncomeService : BudgetBaseService
{
  /*===========================================================
    IncomeService Constructor
  ===========================================================*/
  public IncomeService(IMongoDatabase database)
    : base(database)
  {
  }

  /*===========================================================
    AddIncomeAsync
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