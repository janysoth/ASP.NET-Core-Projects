using MongoDB.Driver;
using TaskManager.Api.Features.Budget.Mappers;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

public class BillService : BudgetBaseService
{
  public BillService(IMongoDatabase database) : base(database)
  {
  }

  /*===========================================================
    GetBillsAsync:
    => Gets bills belonging to the logged-in user.
    => Can optionally filter bills by budget month and year.
    => Returns bills sorted by due date.
  ===========================================================*/
  public async Task<List<BillResponse>> GetBillsAsync(
    string userId,
    int? month,
    int? year)
  {
    var filter = Builders<Bill>.Filter.Eq(b => b.UserId, userId);

    if (month.HasValue || year.HasValue)
    {
      var budgetMonthIds = await GetBudgetMonthIdsAsync(
        userId,
        month,
        year);

      filter &= Builders<Bill>.Filter.In(
        b => b.BudgetMonthId,
        budgetMonthIds);
    }

    var bills = await Bills
      .Find(filter)
      .SortBy(b => b.DueDate)
      .ToListAsync();

    var responses = new List<BillResponse>();

    foreach (var bill in bills)
    {
      responses.Add(await BuildBillResponseAsync(bill, userId));
    }

    return responses;
  }

  /*===========================================================
    GetBillByIdAsync:
    => Gets one bill by ID.
    => Ensures the bill belongs to the logged-in user.
    => Returns the full bill response with linked details.
  ===========================================================*/
  public async Task<BillResponse?> GetBillByIdAsync(
    string billId,
    string userId)
  {
    var bill = await Bills
      .Find(b => b.Id == billId && b.UserId == userId)
      .FirstOrDefaultAsync();

    if (bill == null)
    {
      return null;
    }

    return await BuildBillResponseAsync(bill, userId);
  }

  /*===========================================================
    CreateBillAsync:
    => Creates a bill for a budget month.
    => Requires the category and due date to match that budget month.
    => Does not create an expense until the bill is marked paid.
  ===========================================================*/
  public async Task<BillResponse?> CreateBillAsync(
    string budgetMonthId,
    CreateBillRequest request,
    string userId)
  {
    var budgetMonth = await BudgetMonths
      .Find(b =>
        b.Id == budgetMonthId &&
        b.UserId == userId)
      .FirstOrDefaultAsync();

    if (budgetMonth == null)
    {
      return null;
    }

    if (!IsDateInsideBudgetMonth(
      request.DueDate,
      budgetMonth.Month,
      budgetMonth.Year))
    {
      throw new ArgumentException(
        $"The bill due date must be within {budgetMonth.Month}/{budgetMonth.Year}.");
    }

    var category = await GetCategoryByIdAsync(
      request.BudgetCategoryId,
      userId);

    if (category == null ||
        category.BudgetMonthId != budgetMonthId ||
        category.Type.Equals(
          "Savings",
          StringComparison.OrdinalIgnoreCase))
    {
      return null;
    }

    var bill = new Bill
    {
      UserId = userId,
      BudgetMonthId = budgetMonthId,
      BudgetCategoryId = request.BudgetCategoryId,
      Name = request.Name.Trim(),
      ExpectedAmount = request.ExpectedAmount,
      DueDate = request.DueDate,
      IsPaid = false,
      ExpenseRecordId = null,
      PaidDate = null,
      Notes = request.Notes,
      CreatedAtUtc = DateTime.UtcNow
    };

    await Bills.InsertOneAsync(bill);

    return BillMapper.ToResponse(
      bill,
      category,
      expense: null,
      account: null);
  }

  /*===========================================================
    UpdateBillAsync:
    => Updates the category, name, expected amount, due date, and notes.
    => Keeps a linked paid expense's name and category synchronized.
    => Returns the updated bill.
  ===========================================================*/
  public async Task<BillResponse?> UpdateBillAsync(
    string billId,
    UpdateBillRequest request,
    string userId)
  {
    var bill = await Bills
      .Find(b => b.Id == billId && b.UserId == userId)
      .FirstOrDefaultAsync();

    if (bill == null)
    {
      return null;
    }

    var budgetMonth = await BudgetMonths
    .Find(b =>
      b.Id == bill.BudgetMonthId &&
      b.UserId == userId)
    .FirstOrDefaultAsync();

    if (budgetMonth == null)
    {
      return null;
    }

    if (!IsDateInsideBudgetMonth(
      request.DueDate,
      budgetMonth.Month,
      budgetMonth.Year))
    {
      throw new ArgumentException(
        $"The bill due date must be within {budgetMonth.Month}/{budgetMonth.Year}.");
    }

    var category = await GetCategoryByIdAsync(
      request.BudgetCategoryId,
      userId);

    if (category == null ||
        !IsValidBillCategory(category, bill.BudgetMonthId))
    {
      return null;
    }

    var update = Builders<Bill>.Update
      .Set(b => b.BudgetCategoryId, request.BudgetCategoryId)
      .Set(b => b.Name, request.Name.Trim())
      .Set(b => b.ExpectedAmount, request.ExpectedAmount)
      .Set(b => b.DueDate, request.DueDate)
      .Set(b => b.Notes, request.Notes);

    var result = await Bills.UpdateOneAsync(
      b => b.Id == billId && b.UserId == userId,
      update);

    if (result.MatchedCount == 0)
    {
      return null;
    }

    // Keep the automatically-created expense synchronized.
    if (bill.IsPaid &&
        !string.IsNullOrWhiteSpace(bill.ExpenseRecordId))
    {
      var expenseUpdate = Builders<ExpenseRecord>.Update
        .Set(e => e.Category, category.Name)
        .Set(e => e.Name, request.Name.Trim());

      await ExpenseRecords.UpdateOneAsync(
        e =>
          e.Id == bill.ExpenseRecordId &&
          e.UserId == userId,
        expenseUpdate);
    }

    return await GetBillByIdAsync(billId, userId);
  }

  /*===========================================================
    DeleteBillAsync:
    => Deletes one bill owned by the logged-in user.
    => Also deletes the expense automatically created for that bill.
    => Returns the deleted bill information.
  ===========================================================*/
  public async Task<BillResponse?> DeleteBillAsync(
    string billId,
    string userId)
  {
    var bill = await Bills
      .Find(b => b.Id == billId && b.UserId == userId)
      .FirstOrDefaultAsync();

    if (bill == null)
    {
      return null;
    }

    var deletedBill = await BuildBillResponseAsync(bill, userId);

    if (!string.IsNullOrWhiteSpace(bill.ExpenseRecordId))
    {
      await ExpenseRecords.DeleteOneAsync(
        e =>
          e.Id == bill.ExpenseRecordId &&
          e.UserId == userId);
    }

    var deleteResult = await Bills.DeleteOneAsync(
      b => b.Id == billId && b.UserId == userId);

    if (deleteResult.DeletedCount == 0)
    {
      return null;
    }

    return deletedBill;
  }

  /*===========================================================
    MarkBillPaidAsync:
    => Marks an unpaid bill as paid.
    => Creates an ExpenseRecord using the selected payment account.
    => Links the new expense record back to the bill.
  ===========================================================*/
  public async Task<BillResponse?> MarkBillPaidAsync(
    string billId,
    MarkBillPaidRequest request,
    string userId)
  {
    var bill = await Bills
      .Find(b => b.Id == billId && b.UserId == userId)
      .FirstOrDefaultAsync();

    if (bill == null || bill.IsPaid)
    {
      return null;
    }

    var account = await GetAccountByIdAsync(
      request.AccountId,
      userId);

    if (account == null)
    {
      return null;
    }

    var category = await GetCategoryByIdAsync(
      bill.BudgetCategoryId,
      userId);

    if (category == null ||
        category.BudgetMonthId != bill.BudgetMonthId)
    {
      return null;
    }

    var expense = new ExpenseRecord
    {
      UserId = userId,
      BudgetMonthId = bill.BudgetMonthId,
      AccountId = request.AccountId,
      Category = category.Name,
      Name = bill.Name,
      Amount = request.ActualAmount,
      ExpenseDate = request.PaidDate,
      Notes = request.Notes ?? bill.Notes,
      CreatedAtUtc = DateTime.UtcNow
    };

    await ExpenseRecords.InsertOneAsync(expense);

    var billUpdate = Builders<Bill>.Update
      .Set(b => b.IsPaid, true)
      .Set(b => b.ExpenseRecordId, expense.Id)
      .Set(b => b.PaidDate, request.PaidDate);

    var updateResult = await Bills.UpdateOneAsync(
      b =>
        b.Id == billId &&
        b.UserId == userId &&
        !b.IsPaid,
      billUpdate);

    if (updateResult.ModifiedCount == 0)
    {
      // Remove the expense if the bill could not be updated.
      await ExpenseRecords.DeleteOneAsync(
        e => e.Id == expense.Id && e.UserId == userId);

      return null;
    }

    var updatedBill = await Bills
      .Find(b => b.Id == billId && b.UserId == userId)
      .FirstOrDefaultAsync();

    if (updatedBill == null)
    {
      return null;
    }

    return BillMapper.ToResponse(
      updatedBill,
      category,
      expense,
      account);
  }

  /*===========================================================
    MarkBillUnpaidAsync:
    => Changes a paid bill back to unpaid.
    => Deletes the expense that was created when the bill was paid.
    => Clears the linked expense and paid-date fields.
  ===========================================================*/
  public async Task<BillResponse?> MarkBillUnpaidAsync(
    string billId,
    string userId)
  {
    var bill = await Bills
      .Find(b => b.Id == billId && b.UserId == userId)
      .FirstOrDefaultAsync();

    if (bill == null || !bill.IsPaid)
    {
      return null;
    }

    if (!string.IsNullOrWhiteSpace(bill.ExpenseRecordId))
    {
      await ExpenseRecords.DeleteOneAsync(
        e =>
          e.Id == bill.ExpenseRecordId &&
          e.UserId == userId);
    }

    var update = Builders<Bill>.Update
      .Set(b => b.IsPaid, false)
      .Unset(b => b.ExpenseRecordId)
      .Unset(b => b.PaidDate);

    var result = await Bills.UpdateOneAsync(
      b => b.Id == billId && b.UserId == userId,
      update);

    if (result.MatchedCount == 0)
    {
      return null;
    }

    return await GetBillByIdAsync(billId, userId);
  }

  /*===========================================================
    BuildBillResponseAsync:
    => Loads the category, linked expense, and payment account.
    => Builds a complete response for one bill.
  ===========================================================*/
  private async Task<BillResponse> BuildBillResponseAsync(
    Bill bill,
    string userId)
  {
    var category = await BudgetCategories
      .Find(c =>
        c.Id == bill.BudgetCategoryId &&
        c.UserId == userId)
      .FirstOrDefaultAsync();

    ExpenseRecord? expense = null;
    FinancialAccount? account = null;

    if (!string.IsNullOrWhiteSpace(bill.ExpenseRecordId))
    {
      expense = await ExpenseRecords
        .Find(e =>
          e.Id == bill.ExpenseRecordId &&
          e.UserId == userId)
        .FirstOrDefaultAsync();

      if (expense != null)
      {
        account = await GetAccountByIdAsync(
          expense.AccountId,
          userId);
      }
    }

    return BillMapper.ToResponse(
      bill,
      category,
      expense,
      account);
  }

  /*===========================================================
    GetBudgetMonthIdsAsync:
    => Finds budget month IDs matching optional month/year filters.
    => Allows the bills endpoint to filter without duplicating dates.
  ===========================================================*/
  private async Task<List<string>> GetBudgetMonthIdsAsync(
    string userId,
    int? month,
    int? year)
  {
    var filter = Builders<BudgetMonth>.Filter.Eq(
      b => b.UserId,
      userId);

    if (month.HasValue)
    {
      filter &= Builders<BudgetMonth>.Filter.Eq(
        b => b.Month,
        month.Value);
    }

    if (year.HasValue)
    {
      filter &= Builders<BudgetMonth>.Filter.Eq(
        b => b.Year,
        year.Value);
    }

    var budgetMonths = await BudgetMonths
      .Find(filter)
      .ToListAsync();

    return budgetMonths
      .Select(b => b.Id)
      .ToList();
  }

  /*===========================================================
    IsDateInsideBudgetMonth:
    => Checks whether a date belongs to the selected budget month.
    => Compares the date's month and year to the budget month.
  ===========================================================*/
  private static bool IsDateInsideBudgetMonth(
    DateTime date,
    int budgetMonth,
    int budgetYear)
  {
    return date.Month == budgetMonth &&
           date.Year == budgetYear;
  }

  /*===========================================================
    IsValidBillCategory:
    => Checks whether a category can be linked to a bill.
    => Allows Expense and Debt categories.
    => Rejects Savings categories.
  ===========================================================*/
  private static bool IsValidBillCategory(
    BudgetCategory category,
    string budgetMonthId)
  {
    return category.BudgetMonthId == budgetMonthId &&
           !category.Type.Equals(
             "Savings",
             StringComparison.OrdinalIgnoreCase);
  }
}