using MongoDB.Driver;
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
    ValidateIncomeDateForBudgetMonthAsync

    Confirms that an income date falls inside the budget month
    connected to the income record.

    Example:

    September 2026 budget:
    - September 1 through September 30 is allowed.
    - August 31 is rejected.
    - October 1 is rejected.
    - December 25 is rejected.
  ===========================================================*/
  private async Task<DateTime?> ValidateIncomeDateForBudgetMonthAsync(
    string budgetMonthId,
    DateTime incomeDate,
    string userId)
  {
    /*---------------------------------------------------------
      Find the selected budget month
    ---------------------------------------------------------*/
    var budgetMonth = await BudgetMonths
      .Find(month =>
        month.Id == budgetMonthId &&
        month.UserId == userId)
      .FirstOrDefaultAsync();

    if (budgetMonth == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Normalize the date to UTC

      Dates sent with a trailing Z are already UTC.

      Unspecified dates are treated as UTC so the server's
      local timezone does not unexpectedly move the date into
      another calendar day or month.
    ---------------------------------------------------------*/
    var incomeDateUtc = incomeDate.Kind switch
    {
      DateTimeKind.Utc =>
        incomeDate,

      DateTimeKind.Local =>
        incomeDate.ToUniversalTime(),

      _ =>
        DateTime.SpecifyKind(
          incomeDate,
          DateTimeKind.Utc)
    };

    /*---------------------------------------------------------
      Calculate the valid date range

      The start date is inclusive.
      The next month's start date is exclusive.

      This approach automatically supports months with
      different numbers of days.
    ---------------------------------------------------------*/
    var firstDayOfBudgetMonth = new DateTime(
      budgetMonth.Year,
      budgetMonth.Month,
      1,
      0,
      0,
      0,
      DateTimeKind.Utc);

    var firstDayOfNextMonth =
      firstDayOfBudgetMonth.AddMonths(1);

    /*---------------------------------------------------------
      Reject dates outside the selected budget month
    ---------------------------------------------------------*/
    if (incomeDateUtc < firstDayOfBudgetMonth ||
        incomeDateUtc >= firstDayOfNextMonth)
    {
      throw new ArgumentException(
        "Income date must fall within the selected budget month.");
    }

    return incomeDateUtc;
  }

  /*===========================================================
  AddIncomeAsync

  Creates an income record inside a selected budget month.

  Business rules:
  - The budget month must belong to the logged-in user.
  - The income date must fall inside that budget month.
  - The account must belong to the logged-in user.
  - The amount must be greater than zero.
  - The income source is required.
===========================================================*/
  public async Task<IncomeResponse?> AddIncomeAsync(
    string budgetMonthId,
    CreateIncomeRequest request,
    string userId)
  {
    /*---------------------------------------------------------
      Validate income amount
    ---------------------------------------------------------*/
    if (request.Amount <= 0)
    {
      throw new ArgumentException(
        "Income amount must be greater than zero.");
    }

    /*---------------------------------------------------------
      Validate and normalize income source
    ---------------------------------------------------------*/
    var source =
      request.Source.Trim();

    if (string.IsNullOrWhiteSpace(source))
    {
      throw new ArgumentException(
        "Income source is required.");
    }

    /*---------------------------------------------------------
      Validate selected budget month and income date

      This method also normalizes the date to UTC.
    ---------------------------------------------------------*/
    var incomeDateUtc =
      await ValidateIncomeDateForBudgetMonthAsync(
        budgetMonthId,
        request.IncomeDate,
        userId);

    if (!incomeDateUtc.HasValue)
    {
      return null;
    }

    /*---------------------------------------------------------
      Validate selected financial account
    ---------------------------------------------------------*/
    var account = await GetAccountByIdAsync(
      request.AccountId,
      userId);

    if (account == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Prevent depositing income into a credit card account
    ---------------------------------------------------------*/
    if (string.Equals(
        account.Type,
        "CreditCard",
        StringComparison.OrdinalIgnoreCase))
    {
      throw new ArgumentException(
        "Income cannot be deposited into a credit card account.");
    }

    /*---------------------------------------------------------
      Create new income model
    ---------------------------------------------------------*/
    var income = new IncomeRecord
    {
      UserId = userId,
      BudgetMonthId = budgetMonthId,
      AccountId = account.Id,
      Source = source,
      Amount = request.Amount,
      IncomeDate = incomeDateUtc.Value,
      Notes = string.IsNullOrWhiteSpace(request.Notes)
        ? null
        : request.Notes.Trim(),
      CreatedAtUtc = DateTime.UtcNow
    };

    /*---------------------------------------------------------
      Save income to MongoDB
    ---------------------------------------------------------*/
    await IncomeRecords.InsertOneAsync(
      income);

    /*---------------------------------------------------------
      Return response
    ---------------------------------------------------------*/
    return IncomeMapper.ToResponse(
      income,
      account);
  }

  /*===========================================================
    UpdateIncomeAsync

    Replaces the editable values on an existing income record.

    Business rules:
    - The income record must belong to the logged-in user.
    - The updated date must remain inside the income's
      existing budget month.
    - The selected account must belong to the user.
    - The amount must be greater than zero.
    - The income source is required.
  ===========================================================*/
  public async Task<IncomeResponse?> UpdateIncomeAsync(
    string incomeId,
    UpdateIncomeRequest request,
    string userId)
  {
    /*---------------------------------------------------------
      Find the existing income record

      Its BudgetMonthId is needed for date validation.
    ---------------------------------------------------------*/
    var existingIncome = await IncomeRecords
      .Find(income =>
        income.Id == incomeId &&
        income.UserId == userId)
      .FirstOrDefaultAsync();

    if (existingIncome == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Validate income amount
    ---------------------------------------------------------*/
    if (request.Amount <= 0)
    {
      throw new ArgumentException(
        "Income amount must be greater than zero.");
    }

    /*---------------------------------------------------------
      Validate and normalize income source
    ---------------------------------------------------------*/
    var source =
      request.Source.Trim();

    if (string.IsNullOrWhiteSpace(source))
    {
      throw new ArgumentException(
        "Income source is required.");
    }

    /*---------------------------------------------------------
      Validate updated income date against the income's
      existing budget month
    ---------------------------------------------------------*/
    var incomeDateUtc =
      await ValidateIncomeDateForBudgetMonthAsync(
        existingIncome.BudgetMonthId,
        request.IncomeDate,
        userId);

    if (!incomeDateUtc.HasValue)
    {
      return null;
    }

    /*---------------------------------------------------------
      Validate selected financial account
    ---------------------------------------------------------*/
    var account = await GetAccountByIdAsync(
      request.AccountId,
      userId);

    if (account == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Prevent depositing income into a credit card account
    ---------------------------------------------------------*/
    if (string.Equals(
        account.Type,
        "CreditCard",
        StringComparison.OrdinalIgnoreCase))
    {
      throw new ArgumentException(
        "Income cannot be deposited into a credit card account.");
    }

    /*---------------------------------------------------------
      Build update definition
    ---------------------------------------------------------*/
    var update = Builders<IncomeRecord>.Update
      .Set(income => income.AccountId, account.Id)
      .Set(income => income.Source, source)
      .Set(income => income.Amount, request.Amount)
      .Set(income => income.IncomeDate, incomeDateUtc.Value)
      .Set(
        income => income.Notes,
        string.IsNullOrWhiteSpace(request.Notes)
          ? null
          : request.Notes.Trim());

    /*---------------------------------------------------------
      Update and return the new version from MongoDB
    ---------------------------------------------------------*/
    var updatedIncome =
      await IncomeRecords.FindOneAndUpdateAsync(
        income =>
          income.Id == incomeId &&
          income.UserId == userId,
        update,
        new FindOneAndUpdateOptions<IncomeRecord>
        {
          ReturnDocument = ReturnDocument.After
        });

    if (updatedIncome == null)
    {
      return null;
    }

    return IncomeMapper.ToResponse(
      updatedIncome,
      account);
  }

  /*===========================================================
    PatchIncomeAsync

    Updates only the provided income fields.

    Business rules:
    - The income record must belong to the logged-in user.
    - A provided income date must remain inside the income's
      existing budget month.
    - A provided account must belong to the user.
    - A provided amount must be greater than zero.
    - A provided source cannot be blank.
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
      .Find(existingIncome =>
        existingIncome.Id == incomeId &&
        existingIncome.UserId == userId)
      .FirstOrDefaultAsync();

    if (income == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Build update list from provided fields
    ---------------------------------------------------------*/
    var updates =
      new List<UpdateDefinition<IncomeRecord>>();

    FinancialAccount? selectedAccount = null;

    /*---------------------------------------------------------
      Patch financial account
    ---------------------------------------------------------*/
    if (request.AccountId != null)
    {
      selectedAccount = await GetAccountByIdAsync(
        request.AccountId,
        userId);

      if (selectedAccount == null)
      {
        return null;
      }

      if (string.Equals(
          selectedAccount.Type,
          "CreditCard",
          StringComparison.OrdinalIgnoreCase))
      {
        throw new ArgumentException(
          "Income cannot be deposited into a credit card account.");
      }

      updates.Add(
        Builders<IncomeRecord>.Update.Set(
          existingIncome => existingIncome.AccountId,
          selectedAccount.Id));
    }

    /*---------------------------------------------------------
      Patch income source
    ---------------------------------------------------------*/
    if (request.Source != null)
    {
      var source =
        request.Source.Trim();

      if (string.IsNullOrWhiteSpace(source))
      {
        throw new ArgumentException(
          "Income source is required.");
      }

      updates.Add(
        Builders<IncomeRecord>.Update.Set(
          existingIncome => existingIncome.Source,
          source));
    }

    /*---------------------------------------------------------
      Patch income amount
    ---------------------------------------------------------*/
    if (request.Amount.HasValue)
    {
      if (request.Amount.Value <= 0)
      {
        throw new ArgumentException(
          "Income amount must be greater than zero.");
      }

      updates.Add(
        Builders<IncomeRecord>.Update.Set(
          existingIncome => existingIncome.Amount,
          request.Amount.Value));
    }

    /*---------------------------------------------------------
      Patch income date

      The provided date must remain inside the income record's
      current budget month.
    ---------------------------------------------------------*/
    if (request.IncomeDate.HasValue)
    {
      var incomeDateUtc =
        await ValidateIncomeDateForBudgetMonthAsync(
          income.BudgetMonthId,
          request.IncomeDate.Value,
          userId);

      if (!incomeDateUtc.HasValue)
      {
        return null;
      }

      updates.Add(
        Builders<IncomeRecord>.Update.Set(
          existingIncome => existingIncome.IncomeDate,
          incomeDateUtc.Value));
    }

    /*---------------------------------------------------------
      Patch notes

      An empty or whitespace-only value clears the notes.
    ---------------------------------------------------------*/
    if (request.Notes != null)
    {
      updates.Add(
        Builders<IncomeRecord>.Update.Set(
          existingIncome => existingIncome.Notes,
          string.IsNullOrWhiteSpace(request.Notes)
            ? null
            : request.Notes.Trim()));
    }

    /*---------------------------------------------------------
      Return existing response when nothing changed
    ---------------------------------------------------------*/
    if (updates.Count == 0)
    {
      var existingAccount = await GetAccountByIdAsync(
        income.AccountId,
        userId);

      return IncomeMapper.ToResponse(
        income,
        existingAccount);
    }

    /*---------------------------------------------------------
      Apply combined update and return the updated record
    ---------------------------------------------------------*/
    var updatedIncome =
      await IncomeRecords.FindOneAndUpdateAsync(
        existingIncome =>
          existingIncome.Id == incomeId &&
          existingIncome.UserId == userId,
        Builders<IncomeRecord>.Update.Combine(updates),
        new FindOneAndUpdateOptions<IncomeRecord>
        {
          ReturnDocument = ReturnDocument.After
        });

    if (updatedIncome == null)
    {
      return null;
    }

    var account = selectedAccount ??
      await GetAccountByIdAsync(
        updatedIncome.AccountId,
        userId);

    return IncomeMapper.ToResponse(
      updatedIncome,
      account);
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
    var account = await GetAccountByIdAsync(income.AccountId, userId);

    return IncomeMapper.ToResponse(income, account);
  }
}