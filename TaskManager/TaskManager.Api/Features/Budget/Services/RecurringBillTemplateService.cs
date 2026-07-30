using MongoDB.Driver;
using TaskManager.Api.Features.Budget.Mappers;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

public class RecurringBillTemplateService : BudgetBaseService
{
  /*===========================================================
    RecurringBillTemplateService Constructor:
    => Receives the shared MongoDB database.
    => Passes the database to BudgetBaseService.
  ===========================================================*/
  public RecurringBillTemplateService(
    IMongoDatabase database) : base(database)
  {
  }

  /*===========================================================
    GetTemplatesAsync:
    => Gets all recurring Fixed Expense bill templates
       for the current user.
    => Active templates appear first.
  ===========================================================*/
  public async Task<List<RecurringBillTemplateResponse>>
    GetTemplatesAsync(
      string userId)
  {
    var templates =
      await RecurringBillTemplates
        .Find(template =>
          template.UserId == userId)
        .SortByDescending(template =>
          template.IsActive)
        .ThenBy(template =>
          template.Name)
        .ToListAsync();

    var responses =
      new List<RecurringBillTemplateResponse>();

    foreach (var template in templates)
    {
      responses.Add(
        RecurringBillTemplateMapper.ToResponse(
          template));
    }

    return responses;
  }

  /*===========================================================
    GetTemplateByIdAsync:
    => Gets one recurring Fixed Expense bill template.
    => Confirms the template belongs to the current user.
  ===========================================================*/
  public async Task<RecurringBillTemplateResponse?>
    GetTemplateByIdAsync(
      string templateId,
      string userId)
  {
    var template =
      await RecurringBillTemplates
        .Find(existingTemplate =>
          existingTemplate.Id == templateId &&
          existingTemplate.UserId == userId)
        .FirstOrDefaultAsync();

    if (template == null)
    {
      return null;
    }

    return RecurringBillTemplateMapper.ToResponse(
      template);
  }

  /*===========================================================
    CreateTemplateAsync:
    => Creates a recurring Fixed Expense bill template.

    Required:
    => CategoryName
    => Name
    => ExpectedAmount greater than zero
    => DueDay between 1 and 31

    IMPORTANT:
    => CategoryName is stored instead of CategoryId because
       each monthly budget has different category IDs.
  ===========================================================*/
  public async Task<RecurringBillTemplateResponse?>
    CreateTemplateAsync(
      CreateRecurringBillTemplateRequest request,
      string userId)
  {
    /*---------------------------------------------------------
      Category name is required.
    ---------------------------------------------------------*/
    if (string.IsNullOrWhiteSpace(
      request.CategoryName))
    {
      return null;
    }

    /*---------------------------------------------------------
      Template name is required.
    ---------------------------------------------------------*/
    if (string.IsNullOrWhiteSpace(
      request.Name))
    {
      return null;
    }

    /*---------------------------------------------------------
      Expected amount must be positive.
    ---------------------------------------------------------*/
    if (request.ExpectedAmount <= 0)
    {
      return null;
    }

    /*---------------------------------------------------------
      Due day must represent a possible calendar day.

      Months with fewer days are handled during generation.
    ---------------------------------------------------------*/
    if (request.DueDay < 1 ||
        request.DueDay > 31)
    {
      return null;
    }

    var template =
      new RecurringBillTemplate
      {
        UserId =
          userId,

        CategoryName =
          request.CategoryName.Trim(),

        Name =
          request.Name.Trim(),

        ExpectedAmount =
          request.ExpectedAmount,

        DueDay =
          request.DueDay,

        IsActive =
          request.IsActive,

        Notes =
          request.Notes,

        CreatedAtUtc =
          DateTime.UtcNow
      };

    await RecurringBillTemplates.InsertOneAsync(
      template);

    return RecurringBillTemplateMapper.ToResponse(
      template);
  }

  /*===========================================================
    UpdateTemplateAsync:
    => Updates an existing recurring Fixed Expense template.
    => Previously-generated bills remain unchanged.
    => Future generated bills use the updated template.
  ===========================================================*/
  public async Task<RecurringBillTemplateResponse?>
    UpdateTemplateAsync(
      string templateId,
      UpdateRecurringBillTemplateRequest request,
      string userId)
  {
    /*---------------------------------------------------------
      Confirm the template exists and belongs to the user.
    ---------------------------------------------------------*/
    var existingTemplate =
      await RecurringBillTemplates
        .Find(template =>
          template.Id == templateId &&
          template.UserId == userId)
        .FirstOrDefaultAsync();

    if (existingTemplate == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Validate category name.
    ---------------------------------------------------------*/
    if (string.IsNullOrWhiteSpace(
      request.CategoryName))
    {
      return null;
    }

    /*---------------------------------------------------------
      Validate template name.
    ---------------------------------------------------------*/
    if (string.IsNullOrWhiteSpace(
      request.Name))
    {
      return null;
    }

    /*---------------------------------------------------------
      Validate expected amount.
    ---------------------------------------------------------*/
    if (request.ExpectedAmount <= 0)
    {
      return null;
    }

    /*---------------------------------------------------------
      Validate due day.
    ---------------------------------------------------------*/
    if (request.DueDay < 1 ||
        request.DueDay > 31)
    {
      return null;
    }

    var update =
      Builders<RecurringBillTemplate>.Update
        .Set(
          template =>
            template.CategoryName,
          request.CategoryName.Trim())
        .Set(
          template =>
            template.Name,
          request.Name.Trim())
        .Set(
          template =>
            template.ExpectedAmount,
          request.ExpectedAmount)
        .Set(
          template =>
            template.DueDay,
          request.DueDay)
        .Set(
          template =>
            template.IsActive,
          request.IsActive)
        .Set(
          template =>
            template.Notes,
          request.Notes);

    var result =
      await RecurringBillTemplates.UpdateOneAsync(
        template =>
          template.Id == templateId &&
          template.UserId == userId,
        update);

    if (result.MatchedCount == 0)
    {
      return null;
    }

    return await GetTemplateByIdAsync(
      templateId,
      userId);
  }

  /*===========================================================
    DeleteTemplateAsync:
    => Deletes one recurring bill template.
    => Previously-generated bills remain unchanged.
  ===========================================================*/
  public async Task<RecurringBillTemplateResponse?>
    DeleteTemplateAsync(
      string templateId,
      string userId)
  {
    /*---------------------------------------------------------
      Find the template before deleting it.
    ---------------------------------------------------------*/
    var template =
      await RecurringBillTemplates
        .Find(existingTemplate =>
          existingTemplate.Id == templateId &&
          existingTemplate.UserId == userId)
        .FirstOrDefaultAsync();

    if (template == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Build the response before deletion.
    ---------------------------------------------------------*/
    var deletedTemplate =
      RecurringBillTemplateMapper.ToResponse(
        template);

    /*---------------------------------------------------------
      Delete the template.
    ---------------------------------------------------------*/
    var result =
      await RecurringBillTemplates.DeleteOneAsync(
        existingTemplate =>
          existingTemplate.Id == templateId &&
          existingTemplate.UserId == userId);

    if (result.DeletedCount == 0)
    {
      return null;
    }

    return deletedTemplate;
  }

  /*===========================================================
    GenerateBillsAsync:
    => Generates Fixed Expense bills from all active recurring
       templates for a selected budget month.

    Process:

    1. Find the target budget month.
    2. Load all active recurring templates.
    3. Load existing categories for the target month.
    4. Find each template's category by name.
    5. Automatically create the Fixed Expense category when
       no category with that name exists.
    6. Refuse to reuse a same-name category when it is not
       a Fixed Expense category.
    7. Skip duplicate bills.
    8. Create the bill.

    IMPORTANT:
    => Missing categories are created automatically.
    => Existing categories are never silently changed.
  ===========================================================*/
  public async Task<GenerateBillsResponse?>
    GenerateBillsAsync(
      GenerateBillsRequest request,
      string userId)
  {
    /*---------------------------------------------------------
      Find the selected budget month.
    ---------------------------------------------------------*/
    var budgetMonth =
      await BudgetMonths
        .Find(month =>
          month.UserId == userId &&
          month.Month == request.Month &&
          month.Year == request.Year)
        .FirstOrDefaultAsync();

    if (budgetMonth == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Load all active recurring templates.
    ---------------------------------------------------------*/
    var templates =
      await RecurringBillTemplates
        .Find(template =>
          template.UserId == userId &&
          template.IsActive)
        .SortBy(template =>
          template.DueDay)
        .ThenBy(template =>
          template.Name)
        .ToListAsync();

    /*---------------------------------------------------------
      Load categories for the target month.

      This list will also be updated in memory whenever the
      generator automatically creates a new category.
    ---------------------------------------------------------*/
    var categories =
      await BudgetCategories
        .Find(category =>
          category.UserId == userId &&
          category.BudgetMonthId ==
            budgetMonth.Id)
        .ToListAsync();

    var response =
      new GenerateBillsResponse
      {
        TargetMonth =
          request.Month,

        TargetYear =
          request.Year,

        TotalTemplates =
          templates.Count
      };

    /*---------------------------------------------------------
      Process each recurring template.
    ---------------------------------------------------------*/
    foreach (var template in templates)
    {
      /*-------------------------------------------------------
        Prevent the same template from generating more than
        one bill for the same budget month.
      -------------------------------------------------------*/
      var existingBill =
        await Bills
          .Find(bill =>
            bill.UserId == userId &&
            bill.BudgetMonthId ==
              budgetMonth.Id &&
            bill.RecurringBillTemplateId ==
              template.Id)
          .FirstOrDefaultAsync();

      if (existingBill != null)
      {
        response.SkippedExistingBills++;

        response.Messages.Add(
          $"{template.Name} was skipped because it already exists.");

        continue;
      }

      /*-------------------------------------------------------
        Every recurring template requires CategoryName.
      -------------------------------------------------------*/
      if (string.IsNullOrWhiteSpace(
        template.CategoryName))
      {
        response.SkippedMissingCategories++;

        response.Messages.Add(
          $"{template.Name} was skipped because no category name was configured.");

        continue;
      }

      var normalizedCategoryName =
        template.CategoryName.Trim();

      /*-------------------------------------------------------
        Look for ANY category with the same name first.

        We intentionally do not filter by type yet.

        Why?

        If "Payment" already exists as Variable or Savings,
        we should detect that conflict instead of creating a
        second "Payment" category automatically.
      -------------------------------------------------------*/
      var category =
        categories.FirstOrDefault(
          existingCategory =>
            string.Equals(
              existingCategory.Name,
              normalizedCategoryName,
              StringComparison.OrdinalIgnoreCase));

      /*-------------------------------------------------------
        Category does not exist:

        Automatically create a Fixed Expense category.

        PlannedAmount remains zero because Fixed Expense
        planning comes from linked Bill.ExpectedAmount.
      -------------------------------------------------------*/
      if (category == null)
      {
        category =
          new BudgetCategory
          {
            UserId =
              userId,

            BudgetMonthId =
              budgetMonth.Id,

            Name =
              normalizedCategoryName,

            Type =
              BudgetCategoryTypes.Expense,

            ExpenseType =
              ExpenseTypes.Fixed,

            PlannedAmount =
              0,

            CreatedAtUtc =
              DateTime.UtcNow
          };

        await BudgetCategories.InsertOneAsync(
          category);

        /*
          Add the newly created category to our in-memory list.

          This is important because another recurring template
          may use the same category later in this loop.

          Example:

          Electric Bill → Utilities
          Internet Bill → Utilities

          The first template creates Utilities.
          The second template reuses it.
        */
        categories.Add(
          category);

        response.CreatedCategories++;

        response.Messages.Add(
          $"Fixed Expense category '{category.Name}' was created automatically.");
      }
      else
      {
        /*-----------------------------------------------------
          Category already exists.

          It MUST already be:

          Type        = Expense
          ExpenseType = Fixed

          Never silently change an existing category.
        -----------------------------------------------------*/
        var categoryType =
          BudgetCategoryTypes.Normalize(
            category.Type);

        var expenseType =
          ExpenseTypes.Normalize(
            category.ExpenseType);

        var isFixedExpense =
          categoryType ==
            BudgetCategoryTypes.Expense &&
          expenseType ==
            ExpenseTypes.Fixed;

        if (!isFixedExpense)
        {
          response.SkippedMissingCategories++;

          response.Messages.Add(
            $"{template.Name} was skipped because category " +
            $"'{normalizedCategoryName}' already exists but is not a Fixed Expense category.");

          continue;
        }
      }

      /*-------------------------------------------------------
        Build a valid due date.

        DueDay = 31 automatically becomes the final valid day
        when the selected month has fewer than 31 days.
      -------------------------------------------------------*/
      var dueDate =
        BuildDueDate(
          request.Year,
          request.Month,
          template.DueDay);

      /*-------------------------------------------------------
        Create the Fixed Expense bill.
      -------------------------------------------------------*/
      var bill =
        new Bill
        {
          UserId =
            userId,

          BudgetMonthId =
            budgetMonth.Id,

          BudgetCategoryId =
            category.Id,

          RecurringBillTemplateId =
            template.Id,

          Name =
            template.Name,

          ExpectedAmount =
            template.ExpectedAmount,

          DueDate =
            dueDate,

          IsPaid =
            false,

          ExpenseRecordId =
            null,

          PaidDate =
            null,

          Notes =
            template.Notes,

          CreatedAtUtc =
            DateTime.UtcNow
        };

      await Bills.InsertOneAsync(
        bill);

      response.CreatedBills++;

      response.Bills.Add(
        BillMapper.ToResponse(
          bill,
          category: category));
    }

    return response;
  }

  /*===========================================================
    BuildDueDate:
    => Creates a valid due date for the selected month.
    => If DueDay exceeds the number of days in the month,
       the month's final day is used.

    Example:

    DueDay = 31

    April:
    => April 30

    February 2027:
    => February 28
  ===========================================================*/
  private static DateTime BuildDueDate(
    int year,
    int month,
    int dueDay)
  {
    var daysInMonth =
      DateTime.DaysInMonth(
        year,
        month);

    var validDay =
      Math.Min(
        dueDay,
        daysInMonth);

    return new DateTime(
      year,
      month,
      validDay,
      0,
      0,
      0,
      DateTimeKind.Utc);
  }
}