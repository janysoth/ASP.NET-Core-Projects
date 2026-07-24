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
       type, and expense date.
    => Only Expense categories may receive expense records.
  ===========================================================*/
  public async Task<ExpenseResponse?> AddExpenseAsync(
    string budgetMonthId,
    CreateExpenseRequest request,
    string userId)
  {
    // Load the selected budget month.
    //
    // The full record is needed because the month and year
    // are used to validate the expense date.
    var budgetMonth = await GetBudgetMonthModelByIdAsync(
      budgetMonthId,
      userId);

    if (budgetMonth is null)
    {
      return null;
    }

    // Confirm that the selected financial account exists
    // and belongs to the current user.
    var accountExists = await AccountExistsAsync(
      request.AccountId,
      userId);

    if (!accountExists)
    {
      return null;
    }

    // Load the category and confirm it belongs to the same
    // budget month where the expense is being created.
    var category = await GetBudgetCategoryForMonthAsync(
      request.CategoryId,
      budgetMonthId,
      userId);

    if (category is null)
    {
      return null;
    }

    // Normalize the category type before comparing it.
    var categoryType =
      BudgetCategoryTypes.Normalize(category.Type);

    // Only Expense categories may receive expense records.
    //
    // Savings categories are handled through transfers.
    if (categoryType != BudgetCategoryTypes.Expense)
    {
      return null;
    }

    // DateTime.Month is one-based:
    // January = 1
    // July = 7
    var expectedCalendarMonth =
      budgetMonth.Month;

    // The expense date must belong to the selected
    // budget month.
    if (
      request.ExpenseDate.Month != expectedCalendarMonth ||
      request.ExpenseDate.Year != budgetMonth.Year)
    {
      return null;
    }

    // Create the database model.
    var expenseRecord = new ExpenseRecord
    {
      UserId = userId,
      BudgetMonthId = budgetMonthId,
      AccountId = request.AccountId,
      CategoryId = request.CategoryId,
      Name = request.Name.Trim(),
      Amount = request.Amount,
      ExpenseDate = request.ExpenseDate,
      Notes = string.IsNullOrWhiteSpace(request.Notes)
        ? null
        : request.Notes.Trim(),
      CreatedAtUtc = DateTime.UtcNow
    };

    // Save the expense into MongoDB.
    await ExpenseRecords.InsertOneAsync(expenseRecord);

    // Return the saved expense with both:
    //
    // CategoryId
    // CategoryName
    return ExpenseMapper.ToResponse(
      expenseRecord,
      category.Name);
  }

  /*===========================================================
    UpdateExpenseAsync:
    => Updates an existing expense owned by the current user.
    => Validates the selected account, category, category type,
       budget month, and updated expense date.
  ===========================================================*/
  public async Task<ExpenseResponse?> UpdateExpenseAsync(
    string expenseId,
    UpdateExpenseRequest request,
    string userId)
  {
    // Find the existing expense.
    var existingExpense = await ExpenseRecords
      .Find(expense =>
        expense.Id == expenseId &&
        expense.UserId == userId)
      .FirstOrDefaultAsync();

    if (existingExpense is null)
    {
      return null;
    }

    // Confirm that the selected account exists
    // and belongs to the current user.
    var accountExists = await AccountExistsAsync(
      request.AccountId,
      userId);

    if (!accountExists)
    {
      return null;
    }

    // Load the selected category and confirm that it belongs
    // to the expense's existing budget month.
    var category = await GetBudgetCategoryForMonthAsync(
      request.CategoryId,
      existingExpense.BudgetMonthId,
      userId);

    if (category is null)
    {
      return null;
    }

    // Normalize the category type before comparing it.
    var categoryType =
      BudgetCategoryTypes.Normalize(category.Type);

    // Only Expense categories may be assigned
    // to an expense record.
    if (categoryType != BudgetCategoryTypes.Expense)
    {
      return null;
    }

    // Load the expense's budget month so the updated date
    // can be validated.
    var budgetMonth = await GetBudgetMonthModelByIdAsync(
      existingExpense.BudgetMonthId,
      userId);

    if (budgetMonth is null)
    {
      return null;
    }

    var expectedCalendarMonth =
      budgetMonth.Month;

    // The updated expense date must still belong
    // to the same budget month.
    if (
      request.ExpenseDate.Month != expectedCalendarMonth ||
      request.ExpenseDate.Year != budgetMonth.Year)
    {
      return null;
    }

    // Build the MongoDB update definition.
    var update = Builders<ExpenseRecord>.Update
      .Set(
        expense => expense.AccountId,
        request.AccountId)
      .Set(
        expense => expense.CategoryId,
        request.CategoryId)
      .Set(
        expense => expense.Name,
        request.Name.Trim())
      .Set(
        expense => expense.Amount,
        request.Amount)
      .Set(
        expense => expense.ExpenseDate,
        request.ExpenseDate)
      .Set(
        expense => expense.Notes,
        string.IsNullOrWhiteSpace(request.Notes)
          ? null
          : request.Notes.Trim());

    // Update the expense and return the updated document.
    var updatedExpense = await ExpenseRecords
      .FindOneAndUpdateAsync(
        expense =>
          expense.Id == expenseId &&
          expense.UserId == userId,
        update,
        new FindOneAndUpdateOptions<ExpenseRecord>
        {
          ReturnDocument = ReturnDocument.After
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
    => Only values supplied by the request are changed.
    => Validates account, category, and expense date when those
       values are supplied.
  ===========================================================*/
  public async Task<ExpenseResponse?> PatchExpenseAsync(
    string expenseId,
    PatchExpenseRequest request,
    string userId)
  {
    // Find the existing expense.
    var expense = await ExpenseRecords
      .Find(expense =>
        expense.Id == expenseId &&
        expense.UserId == userId)
      .FirstOrDefaultAsync();

    if (expense is null)
    {
      return null;
    }

    // Start with the existing values.
    var accountId = expense.AccountId;
    var categoryId = expense.CategoryId;
    var name = expense.Name;
    var amount = expense.Amount;
    var expenseDate = expense.ExpenseDate;
    var notes = expense.Notes;

    // ----------------------------------------------------------
    // ACCOUNT
    // ----------------------------------------------------------

    if (!string.IsNullOrWhiteSpace(request.AccountId))
    {
      var accountExists = await AccountExistsAsync(
        request.AccountId,
        userId);

      if (!accountExists)
      {
        return null;
      }

      accountId = request.AccountId;
    }

    // ----------------------------------------------------------
    // CATEGORY
    // ----------------------------------------------------------

    BudgetCategory? category = null;

    if (!string.IsNullOrWhiteSpace(request.CategoryId))
    {
      category = await GetBudgetCategoryForMonthAsync(
        request.CategoryId,
        expense.BudgetMonthId,
        userId);

      if (category is null)
      {
        return null;
      }

      var categoryType =
        BudgetCategoryTypes.Normalize(category.Type);

      if (categoryType != BudgetCategoryTypes.Expense)
      {
        return null;
      }

      categoryId = request.CategoryId;
    }

    // ----------------------------------------------------------
    // NAME
    // ----------------------------------------------------------

    if (request.Name is not null)
    {
      if (string.IsNullOrWhiteSpace(request.Name))
      {
        return null;
      }

      name = request.Name.Trim();
    }

    // ----------------------------------------------------------
    // AMOUNT
    // ----------------------------------------------------------

    if (request.Amount.HasValue)
    {
      if (request.Amount.Value <= 0)
      {
        return null;
      }

      amount = request.Amount.Value;
    }

    // ----------------------------------------------------------
    // EXPENSE DATE
    // ----------------------------------------------------------

    if (request.ExpenseDate.HasValue)
    {
      var budgetMonth =
        await GetBudgetMonthModelByIdAsync(
          expense.BudgetMonthId,
          userId);

      if (budgetMonth is null)
      {
        return null;
      }

      var expectedCalendarMonth =
        budgetMonth.Month;

      if (
        request.ExpenseDate.Value.Month !=
          expectedCalendarMonth ||
        request.ExpenseDate.Value.Year !=
          budgetMonth.Year)
      {
        return null;
      }

      expenseDate =
        request.ExpenseDate.Value;
    }

    // ----------------------------------------------------------
    // NOTES
    // ----------------------------------------------------------

    if (request.Notes is not null)
    {
      notes = string.IsNullOrWhiteSpace(request.Notes)
        ? null
        : request.Notes.Trim();
    }

    // Build the update using the final values.
    var update = Builders<ExpenseRecord>.Update
      .Set(
        expense => expense.AccountId,
        accountId)
      .Set(
        expense => expense.CategoryId,
        categoryId)
      .Set(
        expense => expense.Name,
        name)
      .Set(
        expense => expense.Amount,
        amount)
      .Set(
        expense => expense.ExpenseDate,
        expenseDate)
      .Set(
        expense => expense.Notes,
        notes);

    var updatedExpense =
      await ExpenseRecords.FindOneAndUpdateAsync(
        expense =>
          expense.Id == expenseId &&
          expense.UserId == userId,
        update,
        new FindOneAndUpdateOptions<ExpenseRecord>
        {
          ReturnDocument = ReturnDocument.After
        });

    if (updatedExpense is null)
    {
      return null;
    }

    // If CategoryId was not changed, load the existing category.
    category ??= await GetCategoryByIdAsync(
      updatedExpense.CategoryId,
      userId);

    var categoryName =
      category?.Name ?? "Unknown Category";

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