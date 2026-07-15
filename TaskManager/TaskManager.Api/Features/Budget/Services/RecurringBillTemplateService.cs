using MongoDB.Driver;
using TaskManager.Api.Features.Budget.Mappers;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

public class RecurringBillTemplateService : BudgetBaseService
{
  public RecurringBillTemplateService(
    IMongoDatabase database) : base(database)
  {
  }

  /*===========================================================
    GetTemplatesAsync:
    => Gets all recurring bill templates for the logged-in user.
    => Sorts active templates first and then sorts by name.
  ===========================================================*/
  public async Task<List<RecurringBillTemplateResponse>>
    GetTemplatesAsync(string userId)
  {
    var templates = await RecurringBillTemplates
      .Find(t => t.UserId == userId)
      .SortByDescending(t => t.IsActive)
      .ThenBy(t => t.Name)
      .ToListAsync();

    return templates
      .Select(RecurringBillTemplateMapper.ToResponse)
      .ToList();
  }

  /*===========================================================
    GetTemplateByIdAsync:
    => Gets one recurring bill template.
    => Ensures the template belongs to the logged-in user.
  ===========================================================*/
  public async Task<RecurringBillTemplateResponse?>
    GetTemplateByIdAsync(
      string templateId,
      string userId)
  {
    var template = await RecurringBillTemplates
      .Find(t =>
        t.Id == templateId &&
        t.UserId == userId)
      .FirstOrDefaultAsync();

    return template == null
      ? null
      : RecurringBillTemplateMapper.ToResponse(template);
  }

  /*===========================================================
    CreateTemplateAsync:
    => Creates a reusable monthly bill template.
    => The template itself does not create a bill immediately.
  ===========================================================*/
  public async Task<RecurringBillTemplateResponse>
    CreateTemplateAsync(
      CreateRecurringBillTemplateRequest request,
      string userId)
  {
    var template = new RecurringBillTemplate
    {
      UserId = userId,
      Name = request.Name.Trim(),
      CategoryName = request.CategoryName.Trim(),
      CategoryType = NormalizeCategoryType(
        request.CategoryType),
      ExpectedAmount = request.ExpectedAmount,
      DueDay = request.DueDay,
      IsActive = request.IsActive,
      Notes = request.Notes,
      CreatedAtUtc = DateTime.UtcNow
    };

    await RecurringBillTemplates.InsertOneAsync(template);

    return RecurringBillTemplateMapper.ToResponse(template);
  }

  /*===========================================================
    UpdateTemplateAsync:
    => Updates the recurring template details.
    => Does not modify bills that were already generated.
    => Future generated bills use the updated values.
  ===========================================================*/
  public async Task<RecurringBillTemplateResponse?>
    UpdateTemplateAsync(
      string templateId,
      UpdateRecurringBillTemplateRequest request,
      string userId)
  {
    var update = Builders<RecurringBillTemplate>.Update
      .Set(t => t.Name, request.Name.Trim())
      .Set(t => t.CategoryName, request.CategoryName.Trim())
      .Set(
        t => t.CategoryType,
        NormalizeCategoryType(request.CategoryType))
      .Set(t => t.ExpectedAmount, request.ExpectedAmount)
      .Set(t => t.DueDay, request.DueDay)
      .Set(t => t.IsActive, request.IsActive)
      .Set(t => t.Notes, request.Notes);

    var result = await RecurringBillTemplates.UpdateOneAsync(
      t =>
        t.Id == templateId &&
        t.UserId == userId,
      update);

    if (result.MatchedCount == 0)
    {
      return null;
    }

    return await GetTemplateByIdAsync(templateId, userId);
  }

  /*===========================================================
    DeleteTemplateAsync:
    => Deletes one recurring bill template.
    => Does not delete bills that were previously generated.
    => Returns the deleted template information.
  ===========================================================*/
  public async Task<RecurringBillTemplateResponse?>
    DeleteTemplateAsync(
      string templateId,
      string userId)
  {
    var template = await RecurringBillTemplates
      .Find(t =>
        t.Id == templateId &&
        t.UserId == userId)
      .FirstOrDefaultAsync();

    if (template == null)
    {
      return null;
    }

    var result = await RecurringBillTemplates.DeleteOneAsync(
      t =>
        t.Id == templateId &&
        t.UserId == userId);

    if (result.DeletedCount == 0)
    {
      return null;
    }

    return RecurringBillTemplateMapper.ToResponse(template);
  }

  /*===========================================================
    GenerateBillsAsync:
    => Creates bills from all active recurring templates.
    => Requires the target budget month to already exist.
    => Skips duplicates and templates without matching categories.
  ===========================================================*/
  public async Task<GenerateBillsResponse?>
    GenerateBillsAsync(
      GenerateBillsRequest request,
      string userId)
  {
    var budgetMonth = await BudgetMonths
      .Find(b =>
        b.UserId == userId &&
        b.Month == request.Month &&
        b.Year == request.Year)
      .FirstOrDefaultAsync();

    if (budgetMonth == null)
    {
      return null;
    }

    var templates = await RecurringBillTemplates
      .Find(t =>
        t.UserId == userId &&
        t.IsActive)
      .SortBy(t => t.DueDay)
      .ToListAsync();

    var categories = await BudgetCategories
      .Find(c =>
        c.UserId == userId &&
        c.BudgetMonthId == budgetMonth.Id)
      .ToListAsync();

    var response = new GenerateBillsResponse
    {
      TargetMonth = request.Month,
      TargetYear = request.Year,
      TotalTemplates = templates.Count
    };

    foreach (var template in templates)
    {
      var existingBill = await Bills
        .Find(b =>
          b.UserId == userId &&
          b.BudgetMonthId == budgetMonth.Id &&
          b.RecurringBillTemplateId == template.Id)
        .FirstOrDefaultAsync();

      if (existingBill != null)
      {
        response.SkippedExistingBills++;

        response.Messages.Add(
          $"{template.Name} was skipped because it already exists.");

        continue;
      }

      var category = categories.FirstOrDefault(c =>
        string.Equals(
          c.Name,
          template.CategoryName,
          StringComparison.OrdinalIgnoreCase) &&
        string.Equals(
          c.Type,
          template.CategoryType,
          StringComparison.OrdinalIgnoreCase));

      if (category == null)
      {
        response.SkippedMissingCategories++;

        response.Messages.Add(
          $"{template.Name} was skipped because category " +
          $"'{template.CategoryName}' was not found.");

        continue;
      }

      var dueDate = BuildDueDate(
        request.Year,
        request.Month,
        template.DueDay);

      var bill = new Bill
      {
        UserId = userId,
        BudgetMonthId = budgetMonth.Id,
        BudgetCategoryId = category.Id,
        RecurringBillTemplateId = template.Id,
        Name = template.Name,
        ExpectedAmount = template.ExpectedAmount,
        DueDate = dueDate,
        IsPaid = false,
        ExpenseRecordId = null,
        PaidDate = null,
        Notes = template.Notes,
        CreatedAtUtc = DateTime.UtcNow
      };

      await Bills.InsertOneAsync(bill);

      response.CreatedBills++;

      response.Bills.Add(
        BillMapper.ToResponse(
          bill,
          category,
          expense: null,
          account: null));
    }

    return response;
  }

  /*===========================================================
    BuildDueDate:
    => Creates the valid due date for the target month.
    => Uses the month's final day when DueDay is too large.
    => Example: day 31 becomes February 28 or 29.
  ===========================================================*/
  private static DateTime BuildDueDate(
    int year,
    int month,
    int dueDay)
  {
    var daysInMonth = DateTime.DaysInMonth(year, month);
    var validDay = Math.Min(dueDay, daysInMonth);

    return new DateTime(
      year,
      month,
      validDay,
      0,
      0,
      0,
      DateTimeKind.Utc);
  }

  /*===========================================================
    NormalizeCategoryType:
    => Stores category types in one consistent format.
    => Supported values are Expense and Debt.
  ===========================================================*/
  private static string NormalizeCategoryType(string type)
  {
    return type.Equals(
      "Debt",
      StringComparison.OrdinalIgnoreCase)
        ? "Debt"
        : "Expense";
  }
}