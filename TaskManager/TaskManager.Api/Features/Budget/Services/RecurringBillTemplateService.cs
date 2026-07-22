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
    => Gets all recurring bill templates for the current user.
    => Supports both Expense and Transfer templates.
  ===========================================================*/
  public async Task<List<RecurringBillTemplateResponse>>
    GetTemplatesAsync(string userId)
  {
    var templates = await RecurringBillTemplates
      .Find(t => t.UserId == userId)
      .SortByDescending(t => t.IsActive)
      .ThenBy(t => t.Name)
      .ToListAsync();

    var responses =
      new List<RecurringBillTemplateResponse>();

    foreach (var template in templates)
    {
      responses.Add(
        await BuildTemplateResponseAsync(
          template,
          userId));
    }

    return responses;
  }

  /*===========================================================
    GetTemplateByIdAsync:
    => Gets one recurring bill template.
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

    if (template == null)
    {
      return null;
    }

    return await BuildTemplateResponseAsync(
      template,
      userId);
  }

  /*===========================================================
    CreateTemplateAsync:
    => Creates an Expense or Transfer recurring template.
    => Expense templates store CategoryName.
    => Transfer templates store a CreditCard destination account.
  ===========================================================*/
  public async Task<RecurringBillTemplateResponse?>
    CreateTemplateAsync(
      CreateRecurringBillTemplateRequest request,
      string userId)
  {
    var paymentType =
      BillPaymentTypes.Normalize(
        request.PaymentType);

    if (paymentType == null)
    {
      return null;
    }

    FinancialAccount? destinationAccount = null;

    if (paymentType == BillPaymentTypes.Transfer)
    {
      if (string.IsNullOrWhiteSpace(
        request.DestinationAccountId))
      {
        return null;
      }

      destinationAccount =
        await GetAccountByIdAsync(
          request.DestinationAccountId,
          userId);

      if (destinationAccount == null ||
          !IsCreditCardAccount(
            destinationAccount))
      {
        return null;
      }
    }

    var template = new RecurringBillTemplate
    {
      UserId = userId,

      PaymentType = paymentType,

      CategoryName =
        paymentType == BillPaymentTypes.Expense
          ? request.CategoryName?.Trim()
          : null,

      DestinationAccountId =
        paymentType == BillPaymentTypes.Transfer
          ? destinationAccount?.Id
          : null,

      Name = request.Name.Trim(),
      ExpectedAmount = request.ExpectedAmount,
      DueDay = request.DueDay,
      IsActive = request.IsActive,
      Notes = request.Notes,
      CreatedAtUtc = DateTime.UtcNow
    };

    await RecurringBillTemplates.InsertOneAsync(
      template);

    return RecurringBillTemplateMapper.ToResponse(
      template,
      destinationAccount);
  }

  /*===========================================================
    UpdateTemplateAsync:
    => Updates a recurring template.
    => Existing generated bills remain unchanged.
    => Future bills use the updated template information.
  ===========================================================*/
  public async Task<RecurringBillTemplateResponse?>
    UpdateTemplateAsync(
      string templateId,
      UpdateRecurringBillTemplateRequest request,
      string userId)
  {
    var existingTemplate =
      await RecurringBillTemplates
        .Find(t =>
          t.Id == templateId &&
          t.UserId == userId)
        .FirstOrDefaultAsync();

    if (existingTemplate == null)
    {
      return null;
    }

    var paymentType =
      BillPaymentTypes.Normalize(
        request.PaymentType);

    if (paymentType == null)
    {
      return null;
    }

    FinancialAccount? destinationAccount = null;

    if (paymentType == BillPaymentTypes.Transfer)
    {
      if (string.IsNullOrWhiteSpace(
        request.DestinationAccountId))
      {
        return null;
      }

      destinationAccount =
        await GetAccountByIdAsync(
          request.DestinationAccountId,
          userId);

      if (destinationAccount == null ||
          !IsCreditCardAccount(
            destinationAccount))
      {
        return null;
      }
    }

    var update =
      Builders<RecurringBillTemplate>.Update
        .Set(
          t => t.PaymentType,
          paymentType)
        .Set(
          t => t.CategoryName,
          paymentType == BillPaymentTypes.Expense
            ? request.CategoryName?.Trim()
            : null)
        .Set(
          t => t.DestinationAccountId,
          paymentType == BillPaymentTypes.Transfer
            ? destinationAccount?.Id
            : null)
        .Set(
          t => t.Name,
          request.Name.Trim())
        .Set(
          t => t.ExpectedAmount,
          request.ExpectedAmount)
        .Set(
          t => t.DueDay,
          request.DueDay)
        .Set(
          t => t.IsActive,
          request.IsActive)
        .Set(
          t => t.Notes,
          request.Notes);

    var result =
      await RecurringBillTemplates.UpdateOneAsync(
        t =>
          t.Id == templateId &&
          t.UserId == userId,
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
    => Deletes a recurring bill template.
    => Previously generated bills remain unchanged.
  ===========================================================*/
  public async Task<RecurringBillTemplateResponse?>
    DeleteTemplateAsync(
      string templateId,
      string userId)
  {
    var template =
      await RecurringBillTemplates
        .Find(t =>
          t.Id == templateId &&
          t.UserId == userId)
        .FirstOrDefaultAsync();

    if (template == null)
    {
      return null;
    }

    var deletedTemplate =
      await BuildTemplateResponseAsync(
        template,
        userId);

    var result =
      await RecurringBillTemplates.DeleteOneAsync(
        t =>
          t.Id == templateId &&
          t.UserId == userId);

    if (result.DeletedCount == 0)
    {
      return null;
    }

    return deletedTemplate;
  }

  /*===========================================================
    GenerateBillsAsync:
    => Generates bills from all active recurring templates.
    => Expense templates find a matching category by name.
    => Transfer templates use their CreditCard destination.
    => Duplicate bills are skipped.
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

    var templates =
      await RecurringBillTemplates
        .Find(t =>
          t.UserId == userId &&
          t.IsActive)
        .SortBy(t => t.DueDay)
        .ToListAsync();

    var categories =
      await BudgetCategories
        .Find(c =>
          c.UserId == userId &&
          c.BudgetMonthId == budgetMonth.Id)
        .ToListAsync();

    var response =
      new GenerateBillsResponse
      {
        TargetMonth = request.Month,
        TargetYear = request.Year,
        TotalTemplates = templates.Count
      };

    foreach (var template in templates)
    {
      /*
        Skip if this template already generated
        a bill for this budget month.
      */
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

      BudgetCategory? category = null;
      FinancialAccount? destinationAccount = null;

      /*
        Expense template:
        Find matching Expense category.
      */
      if (template.PaymentType ==
          BillPaymentTypes.Expense)
      {
        if (string.IsNullOrWhiteSpace(
          template.CategoryName))
        {
          response.SkippedMissingCategories++;

          response.Messages.Add(
            $"{template.Name} was skipped because no category was configured.");

          continue;
        }

        category = categories.FirstOrDefault(c =>
          string.Equals(
            c.Name,
            template.CategoryName,
            StringComparison.OrdinalIgnoreCase) &&
          string.Equals(
            c.Type,
            BudgetCategoryTypes.Expense,
            StringComparison.OrdinalIgnoreCase));

        if (category == null)
        {
          response.SkippedMissingCategories++;

          response.Messages.Add(
            $"{template.Name} was skipped because Expense category " +
            $"'{template.CategoryName}' was not found.");

          continue;
        }
      }

      /*
        Transfer template:
        Validate destination CreditCard account.
      */
      if (template.PaymentType ==
          BillPaymentTypes.Transfer)
      {
        if (string.IsNullOrWhiteSpace(
          template.DestinationAccountId))
        {
          response.Messages.Add(
            $"{template.Name} was skipped because no destination account was configured.");

          continue;
        }

        destinationAccount =
          await GetAccountByIdAsync(
            template.DestinationAccountId,
            userId);

        if (destinationAccount == null ||
            !IsCreditCardAccount(
              destinationAccount))
        {
          response.Messages.Add(
            $"{template.Name} was skipped because its CreditCard account was not found.");

          continue;
        }
      }

      var dueDate = BuildDueDate(
        request.Year,
        request.Month,
        template.DueDay);

      var bill = new Bill
      {
        UserId = userId,

        BudgetMonthId =
          budgetMonth.Id,

        PaymentType =
          template.PaymentType,

        BudgetCategoryId =
          template.PaymentType ==
          BillPaymentTypes.Expense
            ? category?.Id
            : null,

        DestinationAccountId =
          template.PaymentType ==
          BillPaymentTypes.Transfer
            ? destinationAccount?.Id
            : null,

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
          category: category,
          expense: null,
          transfers: null,
          expenseAccount: null,
          destinationAccount:
            destinationAccount,
          accountLookup: null));
    }

    return response;
  }

  /*===========================================================
    BuildTemplateResponseAsync:
    => Builds a complete recurring template response.
    => Includes the CreditCard name for Transfer templates.
  ===========================================================*/
  private async Task<RecurringBillTemplateResponse>
    BuildTemplateResponseAsync(
      RecurringBillTemplate template,
      string userId)
  {
    FinancialAccount? destinationAccount = null;

    if (!string.IsNullOrWhiteSpace(
      template.DestinationAccountId))
    {
      destinationAccount =
        await GetAccountByIdAsync(
          template.DestinationAccountId,
          userId);
    }

    return RecurringBillTemplateMapper.ToResponse(
      template,
      destinationAccount);
  }

  /*===========================================================
    BuildDueDate:
    => Creates a valid due date for the target month.
    => A due day of 31 becomes the month's final day when needed.
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

  /*===========================================================
    IsCreditCardAccount:
    => Checks whether the destination account is a CreditCard.
  ===========================================================*/
  private static bool IsCreditCardAccount(
    FinancialAccount account)
  {
    return string.Equals(
      account.Type,
      FinancialAccountTypes.CreditCard,
      StringComparison.OrdinalIgnoreCase);
  }
}