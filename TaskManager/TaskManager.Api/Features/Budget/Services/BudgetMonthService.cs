using MongoDB.Driver;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Mappers;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

/*===========================================================
  BudgetMonthService
-------------------------------------------------------------
  Purpose:
    => Manages budget month records for the Budget module.

  Why:
    => Keeps all budget month logic in one focused service.

  Responsibilities:
    => Get all budget months for the current user.
    => Get one budget month by id.
    => Create a new budget month.
    => Update a budget month.
    => Delete a budget month and its related records.
    => Build complete budget month response objects.

  Inherits:
    => BudgetBaseService
===========================================================*/
public class BudgetMonthService : BudgetBaseService
{
  /*===========================================================
    BudgetMonthService Constructor
  -------------------------------------------------------------
    Purpose:
      => Creates an instance of BudgetMonthService.

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
  public BudgetMonthService(IMongoDatabase database)
    : base(database)
  {
  }

  /*===========================================================
    GetBudgetMonthsAsync
  -------------------------------------------------------------
    Purpose:
      => Retrieves all budget months that belong to the
         current user.

    Why:
      => Allows the frontend to show the user's list of
         monthly budgets.

    Parameters:
      => userId
         The unique identifier of the logged-in user.

    Returns:
      => List<BudgetMonthResponse>

         A list of complete budget month responses, including
         categories, income records, expense records, and totals.

    Business Rules:
      => Only returns budget months owned by the current user.
      => Sorts the newest budget months first.

    MongoDB Operations:
      => Find(BudgetMonths)
      => SortByDescending(Year)
      => ThenByDescending(Month)
      => ToListAsync()

    Process Overview:
      1. Find all budget months for the current user.
      2. Sort by year descending.
      3. Sort by month descending.
      4. Build a complete response for each budget month.
      5. Return the response list.

    Concepts Used:
      ✓ Async / Await
      ✓ MongoDB Driver
      ✓ Find()
      ✓ Sorting
      ✓ foreach Loop
      ✓ DTO Pattern
      ✓ Ownership Filtering
  ===========================================================*/
  public async Task<List<BudgetMonthResponse>> GetBudgetMonthsAsync(
    string userId)
  {
    /*---------------------------------------------------------
      Get user's budget months from MongoDB
    ---------------------------------------------------------*/

    var budgetMonths = await BudgetMonths
      .Find(b => b.UserId == userId)
      .SortByDescending(b => b.Year)
      .ThenByDescending(b => b.Month)
      .ToListAsync();

    /*---------------------------------------------------------
      Build complete response objects
    ---------------------------------------------------------*/

    var responses = new List<BudgetMonthResponse>();

    foreach (var budgetMonth in budgetMonths)
    {
      responses.Add(await BuildBudgetMonthResponseAsync(budgetMonth));
    }

    return responses;
  }

  /*===========================================================
    GetBudgetMonthByIdAsync
  -------------------------------------------------------------
    Purpose:
      => Retrieves one budget month by id.

    Why:
      => Allows the frontend to display the full detail page
         for one selected budget month.

    Parameters:
      => id
         The budget month id being requested.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => BudgetMonthResponse?

         A complete budget month response if found.
         null if the budget month does not exist or does not
         belong to the current user.

    Business Rules:
      => User can only retrieve their own budget month.
      => Returns null instead of exposing another user's data.

    MongoDB Operations:
      => Find(BudgetMonths)
      => FirstOrDefaultAsync()

    Process Overview:
      1. Search BudgetMonths by id and userId.
      2. Return null if no matching budget month is found.
      3. Build and return the complete response if found.

    Concepts Used:
      ✓ Async / Await
      ✓ MongoDB Driver
      ✓ Find()
      ✓ FirstOrDefaultAsync()
      ✓ Nullable Return Type
      ✓ Guard Clause
      ✓ Ownership Validation
  ===========================================================*/
  public async Task<BudgetMonthResponse?> GetBudgetMonthByIdAsync(
    string id,
    string userId)
  {
    var budgetMonth = await BudgetMonths
      .Find(b => b.Id == id && b.UserId == userId)
      .FirstOrDefaultAsync();

    if (budgetMonth == null)
    {
      return null;
    }

    return await BuildBudgetMonthResponseAsync(budgetMonth);
  }

  /*===========================================================
    CreateBudgetMonthAsync
  -------------------------------------------------------------
    Purpose:
      => Creates a new budget month for the current user.

    Why:
      => Allows the user to start budgeting for a new month.

    Parameters:
      => request
         Data sent from the frontend to create the budget month.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => BudgetMonthResponse

         The newly created budget month with calculated totals
         and related record lists.

    Business Rules:
      => New budget month belongs to the current user.
      => CreatedAtUtc is set by the backend.
      => Initial totals are calculated after creation.

    MongoDB Operations:
      => InsertOneAsync(BudgetMonths)

    Process Overview:
      1. Create a new BudgetMonth model.
      2. Copy values from the request.
      3. Attach the current user's id.
      4. Set CreatedAtUtc.
      5. Save the budget month to MongoDB.
      6. Build and return the response.

    Concepts Used:
      ✓ Async / Await
      ✓ MongoDB Driver
      ✓ InsertOneAsync()
      ✓ DTO Pattern
      ✓ Object Initializer
      ✓ DateTime.UtcNow
      ✓ Mapping
  ===========================================================*/
  public async Task<BudgetMonthResponse> CreateBudgetMonthAsync(
    CreateBudgetMonthRequest request,
    string userId)
  {
    var budgetMonth = new BudgetMonth
    {
      UserId = userId,
      Month = request.Month,
      Year = request.Year,
      PlannedIncome = request.PlannedIncome,
      CreatedAtUtc = DateTime.UtcNow
    };

    await BudgetMonths.InsertOneAsync(budgetMonth);

    return await BuildBudgetMonthResponseAsync(budgetMonth);
  }

  /*===========================================================
    UpdateBudgetMonthAsync
  -------------------------------------------------------------
    Purpose:
      => Updates the planned income for an existing budget month.

    Why:
      => Allows the user to adjust their expected income for
         the selected month.

    Parameters:
      => id
         The budget month id being updated.

      => request
         Data sent from the frontend with the updated value.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => BudgetMonthResponse?

         Updated budget month response if successful.
         null if the budget month does not exist or does not
         belong to the current user.

    Business Rules:
      => User can only update their own budget month.
      => Only PlannedIncome is updated by this method.

    MongoDB Operations:
      => Builders<BudgetMonth>.Update
      => UpdateOneAsync(BudgetMonths)

    Process Overview:
      1. Build the MongoDB update definition.
      2. Update the matching budget month by id and userId.
      3. Return null if no document was matched.
      4. Reload and return the updated budget month response.

    Concepts Used:
      ✓ Async / Await
      ✓ MongoDB Driver
      ✓ Update Definition
      ✓ UpdateOneAsync()
      ✓ MatchedCount
      ✓ Nullable Return Type
      ✓ Ownership Validation
  ===========================================================*/
  public async Task<BudgetMonthResponse?> UpdateBudgetMonthAsync(
    string id,
    UpdateBudgetMonthRequest request,
    string userId)
  {
    var update = Builders<BudgetMonth>.Update
      .Set(b => b.PlannedIncome, request.PlannedIncome);

    var result = await BudgetMonths.UpdateOneAsync(
      b => b.Id == id && b.UserId == userId,
      update);

    if (result.MatchedCount == 0)
    {
      return null;
    }

    return await GetBudgetMonthByIdAsync(id, userId);
  }

  /*===========================================================
    DeleteBudgetMonthAsync
  -------------------------------------------------------------
    Purpose:
      => Deletes one budget month and its related records.

    Why:
      => Prevents orphaned categories, income records, and
         expense records from remaining after a budget month
         is deleted.

    Parameters:
      => id
         The budget month id being deleted.

      => userId
         The unique identifier of the logged-in user.

    Returns:
      => BudgetMonthResponse?

         The deleted budget month response if successful.
         null if the budget month does not exist or does not
         belong to the current user.

    Business Rules:
      => User can only delete their own budget month.
      => Related categories, income records, and expense records
         are deleted before the budget month.
      => The response is built before deleting the records.

    MongoDB Operations:
      => Find(BudgetMonths)
      => FirstOrDefaultAsync()
      => DeleteManyAsync(BudgetCategories)
      => DeleteManyAsync(IncomeRecords)
      => DeleteManyAsync(ExpenseRecords)
      => DeleteOneAsync(BudgetMonths)

    Process Overview:
      1. Find the budget month by id and userId.
      2. Return null if not found.
      3. Build the response before deleting data.
      4. Delete related categories.
      5. Delete related income records.
      6. Delete related expense records.
      7. Delete the budget month.
      8. Return the deleted budget month response.

    Concepts Used:
      ✓ Async / Await
      ✓ MongoDB Driver
      ✓ DeleteManyAsync()
      ✓ DeleteOneAsync()
      ✓ Guard Clause
      ✓ Nullable Return Type
      ✓ Ownership Validation
      ✓ Manual Cascade Delete
  ===========================================================*/
  public async Task<BudgetMonthResponse?> DeleteBudgetMonthAsync(
    string id,
    string userId)
  {
    /*---------------------------------------------------------
      Find budget month before deleting
    ---------------------------------------------------------*/

    var budgetMonth = await BudgetMonths
      .Find(b => b.Id == id && b.UserId == userId)
      .FirstOrDefaultAsync();

    if (budgetMonth == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Build response before records are removed
    ---------------------------------------------------------*/

    var deletedBudgetMonth = await BuildBudgetMonthResponseAsync(budgetMonth);

    /*---------------------------------------------------------
      Delete related child records first
    ---------------------------------------------------------*/

    await BudgetCategories.DeleteManyAsync(
      c => c.BudgetMonthId == id && c.UserId == userId);

    await IncomeRecords.DeleteManyAsync(
      i => i.BudgetMonthId == id && i.UserId == userId);

    await ExpenseRecords.DeleteManyAsync(
      e => e.BudgetMonthId == id && e.UserId == userId);

    /*---------------------------------------------------------
      Delete parent budget month
    ---------------------------------------------------------*/

    var deleteResult = await BudgetMonths.DeleteOneAsync(
      b => b.Id == id && b.UserId == userId);

    if (deleteResult.DeletedCount == 0)
    {
      return null;
    }

    return deletedBudgetMonth;
  }

  /*===========================================================
    BuildBudgetMonthResponseAsync
  -------------------------------------------------------------
    Purpose:
      => Builds a complete BudgetMonthResponse from a
         BudgetMonth model.

    Why:
      => Centralizes the response-building logic so multiple
         methods can return the same complete budget structure.

    Parameters:
      => budgetMonth
         The budget month model used to build the response.

    Returns:
      => BudgetMonthResponse

         A complete response containing the budget month,
         categories, income records, expense records, totals,
         balances, and calculated budget values.

    Business Rules:
      => Only includes related records owned by the same user.
      => Categories are sorted alphabetically by name.
      => Income records are sorted newest first.
      => Expense records are sorted newest first.
      => Planned category totals are grouped by category type.
      => LeftToAssign is PlannedIncome minus TotalAssigned.
      => RemainingBalance is TotalIncome minus TotalExpenses.

    MongoDB Operations:
      => Find(BudgetCategories)
      => SortBy(Name)
      => ToListAsync()
      => Find(IncomeRecords)
      => SortByDescending(IncomeDate)
      => ToListAsync()
      => Find(ExpenseRecords)
      => SortByDescending(ExpenseDate)
      => ToListAsync()

    Process Overview:
      1. Get related budget categories.
      2. Get related income records.
      3. Get related expense records.
      4. Calculate actual income and expense totals.
      5. Calculate planned category totals.
      6. Build mapped category, income, and expense responses.
      7. Return the completed BudgetMonthResponse.

    Used By:
      => GetBudgetMonthsAsync()
      => GetBudgetMonthByIdAsync()
      => CreateBudgetMonthAsync()
      => DeleteBudgetMonthAsync()

    Concepts Used:
      ✓ Async / Await
      ✓ MongoDB Driver
      ✓ Find()
      ✓ Sorting
      ✓ LINQ
      ✓ Sum()
      ✓ Where()
      ✓ Select()
      ✓ Mapper Pattern
      ✓ DTO Pattern
      ✓ Calculated Properties
  ===========================================================*/
  private async Task<BudgetMonthResponse> BuildBudgetMonthResponseAsync(
    BudgetMonth budgetMonth)
  {
    /*---------------------------------------------------------
      Get related records
    ---------------------------------------------------------*/

    var budgetCategories = await BudgetCategories
      .Find(c => c.BudgetMonthId == budgetMonth.Id &&
                 c.UserId == budgetMonth.UserId)
      .SortBy(c => c.Name)
      .ToListAsync();

    var incomeRecords = await IncomeRecords
      .Find(i => i.BudgetMonthId == budgetMonth.Id &&
                 i.UserId == budgetMonth.UserId)
      .SortByDescending(i => i.IncomeDate)
      .ToListAsync();

    var expenseRecords = await ExpenseRecords
      .Find(e => e.BudgetMonthId == budgetMonth.Id &&
                 e.UserId == budgetMonth.UserId)
      .SortByDescending(e => e.ExpenseDate)
      .ToListAsync();

    /*---------------------------------------------------------
      Calculate actual totals
    ---------------------------------------------------------*/

    var totalIncome = incomeRecords.Sum(i => i.Amount);
    var totalExpenses = expenseRecords.Sum(e => e.Amount);

    /*---------------------------------------------------------
      Calculate planned category totals
    ---------------------------------------------------------*/

    var totalPlannedExpenses = budgetCategories
      .Where(c => c.Type.Equals("Expense", StringComparison.OrdinalIgnoreCase))
      .Sum(c => c.PlannedAmount);

    var totalPlannedSavings = budgetCategories
      .Where(c => c.Type.Equals("Savings", StringComparison.OrdinalIgnoreCase))
      .Sum(c => c.PlannedAmount);

    var totalPlannedDebt = budgetCategories
      .Where(c => c.Type.Equals("Debt", StringComparison.OrdinalIgnoreCase))
      .Sum(c => c.PlannedAmount);

    var totalAssigned = budgetCategories.Sum(c => c.PlannedAmount);

    /*---------------------------------------------------------
      Build and return response
    ---------------------------------------------------------*/

    return new BudgetMonthResponse
    {
      Id = budgetMonth.Id,
      Month = budgetMonth.Month,
      Year = budgetMonth.Year,
      PlannedIncome = budgetMonth.PlannedIncome,

      TotalIncome = totalIncome,
      TotalExpenses = totalExpenses,
      RemainingBalance = totalIncome - totalExpenses,

      TotalPlannedExpenses = totalPlannedExpenses,
      TotalPlannedSavings = totalPlannedSavings,
      TotalPlannedDebt = totalPlannedDebt,
      TotalAssigned = totalAssigned,
      LeftToAssign = budgetMonth.PlannedIncome - totalAssigned,
      RemainingPlannedExpenseBudget = totalPlannedExpenses - totalExpenses,

      BudgetCategories = budgetCategories
        .Select(c => BudgetCategoryMapper.ToResponse(c, expenseRecords))
        .ToList(),

      IncomeRecords = incomeRecords
        .Select(IncomeMapper.ToResponse)
        .ToList(),

      ExpenseRecords = expenseRecords
        .Select(ExpenseMapper.ToResponse)
        .ToList(),

      CreatedAtUtc = budgetMonth.CreatedAtUtc
    };
  }
}