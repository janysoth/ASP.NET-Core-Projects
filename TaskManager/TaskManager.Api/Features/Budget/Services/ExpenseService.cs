using MongoDB.Driver;
using TaskManager.Api.Features.Budget.Constants;
using TaskManager.Api.Features.Budget.Mappers;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

public sealed class ExpenseService : BudgetBaseService
{
  /*===========================================================
    ExpenseService Constructor
  ===========================================================*/
  public ExpenseService(IMongoDatabase database)
    : base(database)
  {
  }

  /*===========================================================
  ValidateExpenseDateForBudgetMonthAsync:
  => Confirms that an expense date belongs to the selected
     budget month.
  => Returns the normalized UTC date.
  => Returns null when the budget month does not exist.
  => Throws ArgumentException when the date is outside the
     selected budget month.
===========================================================*/
  private async Task<DateTime?>
    ValidateExpenseDateForBudgetMonthAsync(
      string budgetMonthId,
      DateTime expenseDate,
      string userId)
  {
    /*---------------------------------------------------------
      Load the selected budget month
    ---------------------------------------------------------*/
    var budgetMonth =
      await GetBudgetMonthModelByIdAsync(
        budgetMonthId,
        userId);

    if (budgetMonth is null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Normalize the expense date to UTC

      Dates received with a trailing Z are already UTC.

      Unspecified dates are treated as UTC so the server's
      timezone does not move the date into another month.
    ---------------------------------------------------------*/
    var expenseDateUtc =
      expenseDate.Kind switch
      {
        DateTimeKind.Utc =>
          expenseDate,

        DateTimeKind.Local =>
          expenseDate.ToUniversalTime(),

        _ =>
          DateTime.SpecifyKind(
            expenseDate,
            DateTimeKind.Utc)
      };

    /*---------------------------------------------------------
      Build the valid budget-month date range

      The first day is inclusive.

      The first day of the next month is exclusive.
    ---------------------------------------------------------*/
    var firstDayOfBudgetMonth =
      new DateTime(
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
    if (expenseDateUtc < firstDayOfBudgetMonth ||
        expenseDateUtc >= firstDayOfNextMonth)
    {
      throw new ArgumentException(
        "Expense date must fall within the selected budget month.");
    }

    return expenseDateUtc;
  }

  /*===========================================================
    GetExpensesAsync:
    => Gets all expense records owned by the current user.
    => Can optionally filter expenses by month and year.
    => Loads all required category names in one query.
  ===========================================================*/
  public async Task<List<ExpenseResponse>> GetExpensesAsync(
    string userId,
    int? month,
    int? year)
  {
    // Start with a filter that only returns expenses
    // belonging to the current user.
    var expenseFilter = Builders<ExpenseRecord>.Filter.Eq(
      expense => expense.UserId,
      userId);

    // When a month is provided, filter by both month and year.
    //
    // DateTime.Month is one-based:
    // January = 1
    // December = 12
    if (month.HasValue)
    {
      var monthStart = new DateTime(
        year ?? DateTime.UtcNow.Year,
        month.Value,
        1,
        0,
        0,
        0,
        DateTimeKind.Utc);

      var monthEnd = monthStart.AddMonths(1);

      expenseFilter &=
        Builders<ExpenseRecord>.Filter.Gte(
          expense => expense.ExpenseDate,
          monthStart)
        &
        Builders<ExpenseRecord>.Filter.Lt(
          expense => expense.ExpenseDate,
          monthEnd);
    }
    // When only a year is provided, return all expenses
    // recorded during that year.
    else if (year.HasValue)
    {
      var yearStart = new DateTime(
        year.Value,
        1,
        1,
        0,
        0,
        0,
        DateTimeKind.Utc);

      var yearEnd = yearStart.AddYears(1);

      expenseFilter &=
        Builders<ExpenseRecord>.Filter.Gte(
          expense => expense.ExpenseDate,
          yearStart)
        &
        Builders<ExpenseRecord>.Filter.Lt(
          expense => expense.ExpenseDate,
          yearEnd);
    }

    // Get all matching expenses and place the newest first.
    var expenses = await ExpenseRecords
      .Find(expenseFilter)
      .SortByDescending(expense => expense.ExpenseDate)
      .ToListAsync();

    if (expenses.Count == 0)
    {
      return [];
    }

    // Collect all unique category IDs used by the expenses.
    var categoryIds = expenses
      .Select(expense => expense.CategoryId)
      .Where(categoryId =>
        !string.IsNullOrWhiteSpace(categoryId))
      .Distinct()
      .ToList();

    // Load all required categories in one MongoDB query.
    //
    // This prevents one category query from being made
    // for every individual expense.
    var categoryFilter =
      Builders<BudgetCategory>.Filter.Eq(
        category => category.UserId,
        userId)
      &
      Builders<BudgetCategory>.Filter.In(
        category => category.Id,
        categoryIds);

    var categories = await BudgetCategories
      .Find(categoryFilter)
      .ToListAsync();

    // Create a lookup dictionary:
    //
    // CategoryId => CategoryName
    var categoryNames = categories.ToDictionary(
      category => category.Id,
      category => category.Name);

    // Convert each ExpenseRecord into an ExpenseResponse.
    return expenses
      .Select(expense =>
      {
        // Use a fallback name if a referenced category
        // was unexpectedly removed.
        var categoryName = categoryNames.GetValueOrDefault(
          expense.CategoryId,
          "Unknown Category");

        return ExpenseMapper.ToResponse(
          expense,
          categoryName);
      })
      .ToList();
  }

  /*===========================================================
    GetExpenseByIdAsync:
    => Gets one expense owned by the current user.
    => Returns null when the expense does not exist.
  ===========================================================*/
  public async Task<ExpenseResponse?> GetExpenseByIdAsync(
    string expenseId,
    string userId)
  {
    // Find the expense and confirm it belongs
    // to the current user.
    var expense = await ExpenseRecords
      .Find(expense =>
        expense.Id == expenseId &&
        expense.UserId == userId)
      .FirstOrDefaultAsync();

    if (expense is null)
    {
      return null;
    }

    // Load the category referenced by the expense.
    var category = await GetCategoryByIdAsync(
      expense.CategoryId,
      userId);

    var categoryName =
      category?.Name ?? "Unknown Category";

    return ExpenseMapper.ToResponse(
      expense,
      categoryName);
  }

  /*===========================================================
    AddExpenseAsync:
    => Creates a new expense in a budget month.
    => Validates the budget month, account, category, category
       type, amount, name, and expense date.
    => Only Expense categories may receive expense records.
  ===========================================================*/
  public async Task<ExpenseResponse?> AddExpenseAsync(
    string budgetMonthId,
    CreateExpenseRequest request,
    string userId)
  {
    /*---------------------------------------------------------
      Validate expense amount
    ---------------------------------------------------------*/
    if (request.Amount <= 0)
    {
      throw new ArgumentException(
        "Expense amount must be greater than zero.");
    }

    /*---------------------------------------------------------
      Validate and normalize expense name
    ---------------------------------------------------------*/
    var expenseName =
      request.Name.Trim();

    if (string.IsNullOrWhiteSpace(expenseName))
    {
      throw new ArgumentException(
        "Expense name is required.");
    }

    /*---------------------------------------------------------
      Validate the selected budget month and expense date

      This also normalizes the date to UTC.
    ---------------------------------------------------------*/
    var expenseDateUtc =
      await ValidateExpenseDateForBudgetMonthAsync(
        budgetMonthId,
        request.ExpenseDate,
        userId);

    if (!expenseDateUtc.HasValue)
    {
      return null;
    }

    /*---------------------------------------------------------
      Confirm that the selected account exists and belongs
      to the current user
    ---------------------------------------------------------*/
    var accountExists =
      await AccountExistsAsync(
        request.AccountId,
        userId);

    if (!accountExists)
    {
      return null;
    }

    /*---------------------------------------------------------
      Load the category and confirm that it belongs to the
      selected budget month
    ---------------------------------------------------------*/
    var category =
      await GetBudgetCategoryForMonthAsync(
        request.CategoryId,
        budgetMonthId,
        userId);

    if (category is null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Only Expense categories may receive expense records
    ---------------------------------------------------------*/
    var categoryType =
      BudgetCategoryTypes.Normalize(
        category.Type);

    if (categoryType !=
        BudgetCategoryTypes.Expense)
    {
      throw new ArgumentException(
        "Expenses can only use an expense category.");
    }

    /*---------------------------------------------------------
      Create the database model
    ---------------------------------------------------------*/
    var expenseRecord =
      new ExpenseRecord
      {
        UserId = userId,
        BudgetMonthId = budgetMonthId,
        AccountId = request.AccountId,
        CategoryId = request.CategoryId,
        Name = expenseName,
        Amount = request.Amount,
        ExpenseDate = expenseDateUtc.Value,
        Notes =
          string.IsNullOrWhiteSpace(request.Notes)
            ? null
            : request.Notes.Trim(),
        CreatedAtUtc = DateTime.UtcNow
      };

    /*---------------------------------------------------------
      Save the expense into MongoDB
    ---------------------------------------------------------*/
    await ExpenseRecords.InsertOneAsync(
      expenseRecord);

    /*---------------------------------------------------------
      Return the saved expense
    ---------------------------------------------------------*/
    return ExpenseMapper.ToResponse(
      expenseRecord,
      category.Name);
  }

  /*===========================================================
    UpdateExpenseAsync:
    => Completely updates an existing expense.
    => The updated expense date must remain inside the
       expense's original budget month.
  ===========================================================*/
  public async Task<ExpenseResponse?> UpdateExpenseAsync(
    string expenseId,
    UpdateExpenseRequest request,
    string userId)
  {
    /*---------------------------------------------------------
      Find the existing expense
    ---------------------------------------------------------*/
    var existingExpense =
      await ExpenseRecords
        .Find(expense =>
          expense.Id == expenseId &&
          expense.UserId == userId)
        .FirstOrDefaultAsync();

    if (existingExpense is null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Validate expense amount
    ---------------------------------------------------------*/
    if (request.Amount <= 0)
    {
      throw new ArgumentException(
        "Expense amount must be greater than zero.");
    }

    /*---------------------------------------------------------
      Validate and normalize expense name
    ---------------------------------------------------------*/
    var expenseName =
      request.Name.Trim();

    if (string.IsNullOrWhiteSpace(expenseName))
    {
      throw new ArgumentException(
        "Expense name is required.");
    }

    /*---------------------------------------------------------
      Validate the updated expense date against the expense's
      existing budget month
    ---------------------------------------------------------*/
    var expenseDateUtc =
      await ValidateExpenseDateForBudgetMonthAsync(
        existingExpense.BudgetMonthId,
        request.ExpenseDate,
        userId);

    if (!expenseDateUtc.HasValue)
    {
      return null;
    }

    /*---------------------------------------------------------
      Confirm that the selected account exists and belongs
      to the current user
    ---------------------------------------------------------*/
    var accountExists =
      await AccountExistsAsync(
        request.AccountId,
        userId);

    if (!accountExists)
    {
      return null;
    }

    /*---------------------------------------------------------
      Load the category and confirm it belongs to the
      expense's existing budget month
    ---------------------------------------------------------*/
    var category =
      await GetBudgetCategoryForMonthAsync(
        request.CategoryId,
        existingExpense.BudgetMonthId,
        userId);

    if (category is null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Only Expense categories may be assigned
    ---------------------------------------------------------*/
    var categoryType =
      BudgetCategoryTypes.Normalize(
        category.Type);

    if (categoryType !=
        BudgetCategoryTypes.Expense)
    {
      throw new ArgumentException(
        "Expenses can only use an expense category.");
    }

    /*---------------------------------------------------------
      Build the MongoDB update
    ---------------------------------------------------------*/
    var update =
      Builders<ExpenseRecord>.Update
        .Set(
          expense => expense.AccountId,
          request.AccountId)
        .Set(
          expense => expense.CategoryId,
          request.CategoryId)
        .Set(
          expense => expense.Name,
          expenseName)
        .Set(
          expense => expense.Amount,
          request.Amount)
        .Set(
          expense => expense.ExpenseDate,
          expenseDateUtc.Value)
        .Set(
          expense => expense.Notes,
          string.IsNullOrWhiteSpace(request.Notes)
            ? null
            : request.Notes.Trim());

    /*---------------------------------------------------------
      Update and return the updated document
    ---------------------------------------------------------*/
    var updatedExpense =
      await ExpenseRecords.FindOneAndUpdateAsync(
        expense =>
          expense.Id == expenseId &&
          expense.UserId == userId,
        update,
        new FindOneAndUpdateOptions<ExpenseRecord>
        {
          ReturnDocument =
            ReturnDocument.After
        });

    if (updatedExpense is null)
    {
      return null;
    }

    return ExpenseMapper.ToResponse(
      updatedExpense,
      category.Name);
  }

  /*===========================================================
    PatchExpenseAsync:
    => Partially updates an existing expense.
    => Only supplied fields are changed.
    => A supplied expense date must remain inside the
       expense's original budget month.
  ===========================================================*/
  public async Task<ExpenseResponse?> PatchExpenseAsync(
    string expenseId,
    PatchExpenseRequest request,
    string userId)
  {
    /*---------------------------------------------------------
      Find the existing expense
    ---------------------------------------------------------*/
    var expense =
      await ExpenseRecords
        .Find(existingExpense =>
          existingExpense.Id == expenseId &&
          existingExpense.UserId == userId)
        .FirstOrDefaultAsync();

    if (expense is null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Start with the existing values
    ---------------------------------------------------------*/
    var accountId =
      expense.AccountId;

    var categoryId =
      expense.CategoryId;

    var name =
      expense.Name;

    var amount =
      expense.Amount;

    var expenseDate =
      expense.ExpenseDate;

    var notes =
      expense.Notes;

    /*---------------------------------------------------------
      ACCOUNT
    ---------------------------------------------------------*/
    if (request.AccountId is not null)
    {
      if (string.IsNullOrWhiteSpace(
          request.AccountId))
      {
        throw new ArgumentException(
          "Account cannot be empty.");
      }

      var accountExists =
        await AccountExistsAsync(
          request.AccountId,
          userId);

      if (!accountExists)
      {
        return null;
      }

      accountId =
        request.AccountId;
    }

    /*---------------------------------------------------------
      CATEGORY
    ---------------------------------------------------------*/
    BudgetCategory? category =
      null;

    if (request.CategoryId is not null)
    {
      if (string.IsNullOrWhiteSpace(
          request.CategoryId))
      {
        throw new ArgumentException(
          "CategoryId cannot be empty.");
      }

      category =
        await GetBudgetCategoryForMonthAsync(
          request.CategoryId,
          expense.BudgetMonthId,
          userId);

      if (category is null)
      {
        return null;
      }

      var categoryType =
        BudgetCategoryTypes.Normalize(
          category.Type);

      if (categoryType !=
          BudgetCategoryTypes.Expense)
      {
        throw new ArgumentException(
          "Expenses can only use an expense category.");
      }

      categoryId =
        request.CategoryId;
    }

    /*---------------------------------------------------------
      NAME
    ---------------------------------------------------------*/
    if (request.Name is not null)
    {
      var normalizedName =
        request.Name.Trim();

      if (string.IsNullOrWhiteSpace(
          normalizedName))
      {
        throw new ArgumentException(
          "Expense name cannot be empty.");
      }

      name =
        normalizedName;
    }

    /*---------------------------------------------------------
      AMOUNT
    ---------------------------------------------------------*/
    if (request.Amount.HasValue)
    {
      if (request.Amount.Value <= 0)
      {
        throw new ArgumentException(
          "Expense amount must be greater than zero.");
      }

      amount =
        request.Amount.Value;
    }

    /*---------------------------------------------------------
      EXPENSE DATE

      The new date must remain inside the expense's original
      budget month.
    ---------------------------------------------------------*/
    if (request.ExpenseDate.HasValue)
    {
      var expenseDateUtc =
        await ValidateExpenseDateForBudgetMonthAsync(
          expense.BudgetMonthId,
          request.ExpenseDate.Value,
          userId);

      if (!expenseDateUtc.HasValue)
      {
        return null;
      }

      expenseDate =
        expenseDateUtc.Value;
    }

    /*---------------------------------------------------------
      NOTES

      An empty string clears the notes.
    ---------------------------------------------------------*/
    if (request.Notes is not null)
    {
      notes =
        string.IsNullOrWhiteSpace(request.Notes)
          ? null
          : request.Notes.Trim();
    }

    /*---------------------------------------------------------
      Build the update using the final values
    ---------------------------------------------------------*/
    var update =
      Builders<ExpenseRecord>.Update
        .Set(
          existingExpense =>
            existingExpense.AccountId,
          accountId)
        .Set(
          existingExpense =>
            existingExpense.CategoryId,
          categoryId)
        .Set(
          existingExpense =>
            existingExpense.Name,
          name)
        .Set(
          existingExpense =>
            existingExpense.Amount,
          amount)
        .Set(
          existingExpense =>
            existingExpense.ExpenseDate,
          expenseDate)
        .Set(
          existingExpense =>
            existingExpense.Notes,
          notes);

    /*---------------------------------------------------------
      Apply the update
    ---------------------------------------------------------*/
    var updatedExpense =
      await ExpenseRecords.FindOneAndUpdateAsync(
        existingExpense =>
          existingExpense.Id == expenseId &&
          existingExpense.UserId == userId,
        update,
        new FindOneAndUpdateOptions<ExpenseRecord>
        {
          ReturnDocument =
            ReturnDocument.After
        });

    if (updatedExpense is null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Load the category name when CategoryId was not changed
    ---------------------------------------------------------*/
    category ??=
      await GetCategoryByIdAsync(
        updatedExpense.CategoryId,
        userId);

    var categoryName =
      category?.Name ??
      "Unknown Category";

    return ExpenseMapper.ToResponse(
      updatedExpense,
      categoryName);
  }

  /*===========================================================
    DeleteExpenseAsync:
    => Deletes one expense owned by the current user.
    => Returns the deleted expense information.
  ===========================================================*/
  public async Task<ExpenseResponse?> DeleteExpenseAsync(
    string expenseId,
    string userId)
  {
    // Delete the expense and return the deleted document.
    var deletedExpense = await ExpenseRecords
      .FindOneAndDeleteAsync(expense =>
        expense.Id == expenseId &&
        expense.UserId == userId);

    if (deletedExpense is null)
    {
      return null;
    }

    // Load the category so its readable name can be included
    // in the deleted expense response.
    var category = await GetCategoryByIdAsync(
      deletedExpense.CategoryId,
      userId);

    var categoryName =
      category?.Name ?? "Unknown Category";

    return ExpenseMapper.ToResponse(
      deletedExpense,
      categoryName);
  }
}