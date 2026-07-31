using MongoDB.Driver;
using TaskManager.Api.Features.Budget.Constants;
using TaskManager.Api.Features.Budget.Mappers;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

public class BillService : BudgetBaseService
{
  /*===========================================================
    BillService Constructor:
    => Receives the shared MongoDB database.
    => Passes the database to BudgetBaseService.
  ===========================================================*/
  public BillService(
    IMongoDatabase database) : base(database)
  {
  }

  /*===========================================================
    GetBillsAsync:
    => Gets all bills belonging to the logged-in user.
    => Supports optional month and year filters.
    => Returns bills sorted by due date.

    IMPORTANT:
    => Bills now represent Fixed Expense obligations only.
  ===========================================================*/
  public async Task<List<BillResponse>> GetBillsAsync(
    string userId,
    int? month,
    int? year)
  {
    var filter =
      Builders<Bill>.Filter.Eq(
        bill => bill.UserId,
        userId);

    /*
      When month/year filters are supplied, first find
      the matching BudgetMonth IDs.
    */
    if (month.HasValue ||
        year.HasValue)
    {
      var budgetMonthIds =
        await GetBudgetMonthIdsAsync(
          userId,
          month,
          year);

      filter &=
        Builders<Bill>.Filter.In(
          bill => bill.BudgetMonthId,
          budgetMonthIds);
    }

    var bills =
      await Bills
        .Find(filter)
        .SortBy(bill =>
          bill.DueDate)
        .ToListAsync();

    var responses =
      new List<BillResponse>();

    foreach (var bill in bills)
    {
      responses.Add(
        await BuildBillResponseAsync(
          bill,
          userId));
    }

    return responses;
  }

  /*===========================================================
    GetBillByIdAsync:
    => Gets one bill by ID.
    => Confirms the bill belongs to the logged-in user.
    => Returns the complete BillResponse.
  ===========================================================*/
  public async Task<BillResponse?> GetBillByIdAsync(
    string billId,
    string userId)
  {
    var bill =
      await Bills
        .Find(existingBill =>
          existingBill.Id == billId &&
          existingBill.UserId == userId)
        .FirstOrDefaultAsync();

    if (bill == null)
    {
      return null;
    }

    return await BuildBillResponseAsync(
      bill,
      userId);
  }

  /*===========================================================
    CreateBillAsync:
    => Creates a Fixed Expense bill.

    Rules:
    => Name is required.
    => ExpectedAmount must be greater than zero.
    => Bill must belong to a Fixed Expense category.
    => Category must belong to the selected budget month.
    => DueDate must belong to the selected budget month.
    => Future due dates are allowed.

    IMPORTANT:
    => Bill.ExpectedAmount automatically contributes to the
       Fixed planned budget.
  ===========================================================*/
  public async Task<BillResponse?> CreateBillAsync(
    string budgetMonthId,
    CreateBillRequest request,
    string userId)
  {
    /*---------------------------------------------------------
      Bill name is required.
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
      BudgetCategoryId is required because every bill now
      belongs to a Fixed Expense category.
    ---------------------------------------------------------*/
    if (string.IsNullOrWhiteSpace(
      request.BudgetCategoryId))
    {
      return null;
    }

    /*---------------------------------------------------------
      Load the selected budget month.
    ---------------------------------------------------------*/
    var budgetMonth =
      await GetBudgetMonthModelByIdAsync(
        budgetMonthId,
        userId);

    if (budgetMonth == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Due date must belong to the selected budget month.

      Example:

      August Budget
      → Bill DueDate must be in August.
    ---------------------------------------------------------*/
    if (!IsDateInsideBudgetMonth(
      request.DueDate,
      budgetMonth.Month,
      budgetMonth.Year))
    {
      throw new ArgumentException(
        "The bill due date must be within the selected budget month.");
    }

    /*---------------------------------------------------------
      Load and validate the category.

      Bills may only use:

      Type        = Expense
      ExpenseType = Fixed
    ---------------------------------------------------------*/
    var category =
      await GetBudgetCategoryForMonthAsync(
        request.BudgetCategoryId,
        budgetMonthId,
        userId);

    if (category == null ||
        !IsValidBillCategory(
          category,
          budgetMonthId))
    {
      return null;
    }

    /*---------------------------------------------------------
      Create the bill.
    ---------------------------------------------------------*/
    var bill =
      new Bill
      {
        UserId =
          userId,

        BudgetMonthId =
          budgetMonthId,

        BudgetCategoryId =
          category.Id,

        Name =
          request.Name.Trim(),

        ExpectedAmount =
          request.ExpectedAmount,

        DueDate =
          request.DueDate,

        IsPaid =
          false,

        ExpenseRecordId =
          null,

        PaidDate =
          null,

        Notes =
          request.Notes,

        CreatedAtUtc =
          DateTime.UtcNow
      };

    await Bills.InsertOneAsync(
      bill);

    return BillMapper.ToResponse(
      bill,
      category: category);
  }

  /*===========================================================
    UpdateBillAsync:
    => Updates an existing Fixed Expense bill.

    Rules:
    => Name is required.
    => ExpectedAmount must be greater than zero.
    => Category must remain a Fixed Expense category.
    => DueDate must remain inside the bill's budget month.

    Paid Bill:
    => If name/category changes, the linked ExpenseRecord
       is kept synchronized.
  ===========================================================*/
  public async Task<BillResponse?> UpdateBillAsync(
    string billId,
    UpdateBillRequest request,
    string userId)
  {
    /*---------------------------------------------------------
      Bill name is required.
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

    if (string.IsNullOrWhiteSpace(
      request.BudgetCategoryId))
    {
      return null;
    }

    /*---------------------------------------------------------
      Find the existing bill.
    ---------------------------------------------------------*/
    var bill =
      await Bills
        .Find(existingBill =>
          existingBill.Id == billId &&
          existingBill.UserId == userId)
        .FirstOrDefaultAsync();

    if (bill == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Load the bill's budget month.
    ---------------------------------------------------------*/
    var budgetMonth =
      await GetBudgetMonthModelByIdAsync(
        bill.BudgetMonthId,
        userId);

    if (budgetMonth == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Due date must remain inside the bill's budget month.
    ---------------------------------------------------------*/
    if (!IsDateInsideBudgetMonth(
      request.DueDate,
      budgetMonth.Month,
      budgetMonth.Year))
    {
      throw new ArgumentException(
        "The bill due date must be within the selected budget month.");
    }

    /*---------------------------------------------------------
      Load and validate the new category.
    ---------------------------------------------------------*/
    var category =
      await GetBudgetCategoryForMonthAsync(
        request.BudgetCategoryId,
        bill.BudgetMonthId,
        userId);

    if (category == null ||
        !IsValidBillCategory(
          category,
          bill.BudgetMonthId))
    {
      return null;
    }

    var normalizedName =
      request.Name.Trim();

    /*---------------------------------------------------------
      If the bill has already been paid, keep the generated
      ExpenseRecord synchronized with bill name/category.

      We intentionally DO NOT automatically overwrite the
      ExpenseRecord.Amount when ExpectedAmount changes.

      ExpectedAmount = planned amount.
      ExpenseRecord.Amount = actual amount paid.
    ---------------------------------------------------------*/
    if (bill.IsPaid &&
        !string.IsNullOrWhiteSpace(
          bill.ExpenseRecordId))
    {
      var expenseUpdate =
        Builders<ExpenseRecord>.Update
          .Set(
            expense =>
              expense.CategoryId,
            category.Id)
          .Set(
            expense =>
              expense.Name,
            normalizedName);

      await ExpenseRecords.UpdateOneAsync(
        expense =>
          expense.Id ==
            bill.ExpenseRecordId &&
          expense.UserId ==
            userId,
        expenseUpdate);
    }

    /*---------------------------------------------------------
      Update the bill.
    ---------------------------------------------------------*/
    var update =
      Builders<Bill>.Update
        .Set(
          existingBill =>
            existingBill.BudgetCategoryId,
          category.Id)
        .Set(
          existingBill =>
            existingBill.Name,
          normalizedName)
        .Set(
          existingBill =>
            existingBill.ExpectedAmount,
          request.ExpectedAmount)
        .Set(
          existingBill =>
            existingBill.DueDate,
          request.DueDate)
        .Set(
          existingBill =>
            existingBill.Notes,
          request.Notes);

    var result =
      await Bills.UpdateOneAsync(
        existingBill =>
          existingBill.Id == billId &&
          existingBill.UserId == userId,
        update);

    if (result.MatchedCount == 0)
    {
      return null;
    }

    return await GetBillByIdAsync(
      billId,
      userId);
  }

  /*===========================================================
      DeleteBillAsync:
      => Deletes an unpaid bill owned by the logged-in user.
      => Returns the deleted bill information.

      Important:
      => A paid bill cannot be deleted because it is linked
         to an ExpenseRecord.

      => The payment must be reversed before the bill can
         be deleted.

      => Deleting an unpaid bill does not delete its category.
    ===========================================================*/
  public async Task<BillResponse?> DeleteBillAsync(
    string billId,
    string userId)
  {
    /*
      Find the bill before attempting to delete it.

      The userId condition ensures that users can only
      delete their own bills.
    */
    var bill =
      await Bills
        .Find(existingBill =>
          existingBill.Id == billId &&
          existingBill.UserId == userId)
        .FirstOrDefaultAsync();

    /*
      Return null when the bill does not exist or does not
      belong to the logged-in user.
    */
    if (bill is null)
    {
      return null;
    }

    /*
      Protect paid bills from deletion.

      A paid bill should have an ExpenseRecordId linking it
      to the expense created when the bill was paid.

      Deleting the bill while preserving the expense would
      remove important bill-payment history.
    */
    if (bill.IsPaid ||
        !string.IsNullOrWhiteSpace(bill.ExpenseRecordId))
    {
      throw new InvalidOperationException(
        "A paid bill cannot be deleted because it is part of the payment history.");
    }

    /*
      Load the budget category used by the bill.

      This allows the deleted response to include the
      category name.
    */
    var category =
      await BudgetCategories
        .Find(existingCategory =>
          existingCategory.Id == bill.BudgetCategoryId &&
          existingCategory.UserId == userId)
        .FirstOrDefaultAsync();

    /*
      Build the response before deleting the bill.

      After the document is deleted, we still want to return
      the bill information to the client.
    */
    var deletedBill =
      BillMapper.ToResponse(
        bill,
        category);

    /*
      Delete the unpaid bill.
    */
    var deleteResult =
      await Bills.DeleteOneAsync(
        existingBill =>
          existingBill.Id == billId &&
          existingBill.UserId == userId);

    /*
      This protects against an unexpected situation where
      the bill was found but was not actually deleted.
    */
    if (deleteResult.DeletedCount == 0)
    {
      return null;
    }

    return deletedBill;
  }

  /*===========================================================
    MarkBillPaidAsync:
    => Marks a Fixed Expense bill as paid.
    => Creates one ExpenseRecord for the actual payment.
    => PaidDate cannot be in the future.
    => PaidDate may be up to 14 days before the budget month.
    => PaidDate cannot be after the budget month ends.

    Option A:

    ExpectedAmount and ActualAmount may differ.

    Example:

    Expected = $80
    Actual   = $74

    Bill:
    => Paid
    => RemainingAmount = $0

    Budget:
    => Planned   = $80
    => Spent     = $74
    => Remaining = $6
  ===========================================================*/
  public async Task<BillResponse?> MarkBillPaidAsync(
    string billId,
    MarkBillPaidRequest request,
    string userId)
  {
    /*---------------------------------------------------------
      Find the bill.
    ---------------------------------------------------------*/
    var bill =
      await Bills
        .Find(existingBill =>
          existingBill.Id == billId &&
          existingBill.UserId == userId)
        .FirstOrDefaultAsync();

    if (bill == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Bills can only be paid once.
    ---------------------------------------------------------*/
    if (bill.IsPaid)
    {
      return null;
    }

    /*---------------------------------------------------------
      Actual amount must be positive.
    ---------------------------------------------------------*/
    if (request.ActualAmount <= 0)
    {
      return null;
    }

    /*---------------------------------------------------------
      Normalize the payment date.

      Using .Date ensures that time-of-day differences do not
      affect date validation.
    ---------------------------------------------------------*/
    var paidDate =
      request.PaidDate.Date;

    /*---------------------------------------------------------
      A payment represents money that has already moved.

      Future payment dates are not allowed.
    ---------------------------------------------------------*/
    if (paidDate >
        DateTime.UtcNow.Date)
    {
      return null;
    }

    /*---------------------------------------------------------
      Load the budget month that owns this bill.

      We need the month and year to calculate the allowed
      payment-date window.
    ---------------------------------------------------------*/
    var budgetMonth =
      await BudgetMonths
        .Find(existingMonth =>
          existingMonth.Id ==
            bill.BudgetMonthId &&
          existingMonth.UserId ==
            userId)
        .FirstOrDefaultAsync();

    if (budgetMonth == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Validate the stored month before creating DateTime values.

      The application currently stores months using:

      January  = 1
      August   = 8
      December = 12
    ---------------------------------------------------------*/
    if (budgetMonth.Month < 1 ||
        budgetMonth.Month > 12)
    {
      return null;
    }

    /*---------------------------------------------------------
      Determine the first and last days of the budget month.

      Example:

      Budget month:
      August 2026

      Start:
      August 1, 2026

      End:
      August 31, 2026
    ---------------------------------------------------------*/
    var budgetMonthStart =
      new DateTime(
        budgetMonth.Year,
        budgetMonth.Month,
        1,
        0,
        0,
        0,
        DateTimeKind.Utc);

    var budgetMonthEnd =
      budgetMonthStart
        .AddMonths(1)
        .AddDays(-1);

    /*---------------------------------------------------------
      A bill may be paid up to 14 days before its budget month.

      Example:

      August 2026 bill

      Earliest allowed payment:
      July 18, 2026
    ---------------------------------------------------------*/
    var earliestAllowedPaidDate =
      budgetMonthStart
        .AddDays(-14);

    /*---------------------------------------------------------
      Prevent a bill from being paid too early.

      This avoids assigning an August bill to a payment made
      several months before August.
    ---------------------------------------------------------*/
    if (paidDate <
        earliestAllowedPaidDate)
    {
      return null;
    }

    /*---------------------------------------------------------
      Prevent a bill from being paid after its budget month.

      Example:

      An August bill cannot be paid with a September date.

      The future-date validation will normally catch future
      dates first, but this also protects older budget months.
    ---------------------------------------------------------*/
    if (paidDate >
        budgetMonthEnd)
    {
      return null;
    }

    /*---------------------------------------------------------
      Load the account used to pay the bill.

      Allowed examples:

      Checking
      Savings
      CreditCard
    ---------------------------------------------------------*/
    var paymentAccount =
      await GetAccountByIdAsync(
        request.AccountId,
        userId);

    if (paymentAccount == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Load and validate the bill category.
    ---------------------------------------------------------*/
    var category =
      await GetBudgetCategoryForMonthAsync(
        bill.BudgetCategoryId,
        bill.BudgetMonthId,
        userId);

    if (category == null ||
        !IsValidBillCategory(
          category,
          bill.BudgetMonthId))
    {
      return null;
    }

    /*---------------------------------------------------------
      Create the actual ExpenseRecord.

      Bill.ExpectedAmount remains the planned amount.

      ExpenseRecord.Amount stores what was actually paid.
    ---------------------------------------------------------*/
    var expense =
      new ExpenseRecord
      {
        UserId =
          userId,

        BudgetMonthId =
          bill.BudgetMonthId,

        AccountId =
          paymentAccount.Id,

        CategoryId =
          category.Id,

        Name =
          bill.Name,

        Amount =
          request.ActualAmount,

        ExpenseDate =
          paidDate,

        Notes =
          request.Notes ??
          bill.Notes,

        CreatedAtUtc =
          DateTime.UtcNow
      };

    await ExpenseRecords.InsertOneAsync(
      expense);

    /*---------------------------------------------------------
      Mark the bill paid and connect it to the ExpenseRecord.
    ---------------------------------------------------------*/
    var billUpdate =
      Builders<Bill>.Update
        .Set(
          existingBill =>
            existingBill.IsPaid,
          true)
        .Set(
          existingBill =>
            existingBill.ExpenseRecordId,
          expense.Id)
        .Set(
          existingBill =>
            existingBill.PaidDate,
          paidDate);

    /*---------------------------------------------------------
      !IsPaid protects against two requests trying to pay
      the same bill at the same time.
    ---------------------------------------------------------*/
    var updateResult =
      await Bills.UpdateOneAsync(
        existingBill =>
          existingBill.Id ==
            bill.Id &&
          existingBill.UserId ==
            userId &&
          !existingBill.IsPaid,
        billUpdate);

    if (updateResult.ModifiedCount == 0)
    {
      /*
        Roll back the ExpenseRecord if the bill could not
        successfully transition to Paid.
      */
      await ExpenseRecords.DeleteOneAsync(
        expenseRecord =>
          expenseRecord.Id ==
            expense.Id &&
          expenseRecord.UserId ==
            userId);

      return null;
    }

    /*---------------------------------------------------------
      Reload and return the updated bill.
    ---------------------------------------------------------*/
    var updatedBill =
      await Bills
        .Find(existingBill =>
          existingBill.Id ==
            bill.Id &&
          existingBill.UserId ==
            userId)
        .FirstOrDefaultAsync();

    if (updatedBill == null)
    {
      return null;
    }

    return await BuildBillResponseAsync(
      updatedBill,
      userId);
  }

  /*===========================================================
    MarkBillUnpaidAsync:
    => Reverses a bill payment.
    => Deletes the ExpenseRecord created when the bill was paid.
    => Resets the bill to unpaid.

    This automatically reverses:
    => Transaction history.
    => Category spending.
    => Account balance impact.
  ===========================================================*/
  public async Task<BillResponse?> MarkBillUnpaidAsync(
    string billId,
    string userId)
  {
    /*---------------------------------------------------------
      Find the bill.
    ---------------------------------------------------------*/
    var bill =
      await Bills
        .Find(existingBill =>
          existingBill.Id == billId &&
          existingBill.UserId == userId)
        .FirstOrDefaultAsync();

    if (bill == null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Bill must currently be paid.
    ---------------------------------------------------------*/
    if (!bill.IsPaid)
    {
      return null;
    }

    /*---------------------------------------------------------
      Paid bills must have the ExpenseRecord generated when
      they were paid.
    ---------------------------------------------------------*/
    if (string.IsNullOrWhiteSpace(
      bill.ExpenseRecordId))
    {
      return null;
    }

    /*---------------------------------------------------------
      Delete the linked ExpenseRecord.
    ---------------------------------------------------------*/
    var deleteResult =
      await ExpenseRecords.DeleteOneAsync(
        expense =>
          expense.Id ==
            bill.ExpenseRecordId &&
          expense.UserId ==
            userId);

    if (deleteResult.DeletedCount == 0)
    {
      return null;
    }

    /*---------------------------------------------------------
      Reset the bill to unpaid.
    ---------------------------------------------------------*/
    var update =
      Builders<Bill>.Update
        .Set(
          existingBill =>
            existingBill.IsPaid,
          false)
        .Unset(
          existingBill =>
            existingBill.ExpenseRecordId)
        .Unset(
          existingBill =>
            existingBill.PaidDate);

    var updateResult =
      await Bills.UpdateOneAsync(
        existingBill =>
          existingBill.Id == billId &&
          existingBill.UserId == userId,
        update);

    if (updateResult.MatchedCount == 0)
    {
      return null;
    }

    /*---------------------------------------------------------
      Reload the bill after reversing the payment.
    ---------------------------------------------------------*/
    var updatedBill =
      await Bills
        .Find(existingBill =>
          existingBill.Id == billId &&
          existingBill.UserId == userId)
        .FirstOrDefaultAsync();

    if (updatedBill == null)
    {
      return null;
    }

    return await BuildBillResponseAsync(
      updatedBill,
      userId);
  }

  /*===========================================================
    BuildBillResponseAsync:
    => Builds the complete response for one bill.
    => Loads:
       - Fixed Expense category.
       - Linked ExpenseRecord when paid.
       - Payment account when paid.
  ===========================================================*/
  private async Task<BillResponse> BuildBillResponseAsync(
    Bill bill,
    string userId)
  {
    /*---------------------------------------------------------
      Load the bill's Fixed Expense category.
    ---------------------------------------------------------*/
    var category =
      await GetCategoryByIdAsync(
        bill.BudgetCategoryId,
        userId);

    ExpenseRecord? expense = null;
    FinancialAccount? paymentAccount = null;

    /*---------------------------------------------------------
      If the bill has been paid, load its ExpenseRecord.
    ---------------------------------------------------------*/
    if (!string.IsNullOrWhiteSpace(
      bill.ExpenseRecordId))
    {
      expense =
        await ExpenseRecords
          .Find(expenseRecord =>
            expenseRecord.Id ==
              bill.ExpenseRecordId &&
            expenseRecord.UserId ==
              userId)
          .FirstOrDefaultAsync();

      /*
        Load the account used for the payment.
      */
      if (expense != null)
      {
        paymentAccount =
          await GetAccountByIdAsync(
            expense.AccountId,
            userId);
      }
    }

    return BillMapper.ToResponse(
      bill,
      category: category,
      expense: expense,
      paymentAccount: paymentAccount);
  }

  /*===========================================================
    GetBudgetMonthIdsAsync:
    => Finds BudgetMonth IDs matching optional month/year
       filters.
  ===========================================================*/
  private async Task<List<string>> GetBudgetMonthIdsAsync(
    string userId,
    int? month,
    int? year)
  {
    var filter =
      Builders<BudgetMonth>.Filter.Eq(
        budget =>
          budget.UserId,
        userId);

    if (month.HasValue)
    {
      filter &=
        Builders<BudgetMonth>.Filter.Eq(
          budget =>
            budget.Month,
          month.Value);
    }

    if (year.HasValue)
    {
      filter &=
        Builders<BudgetMonth>.Filter.Eq(
          budget =>
            budget.Year,
          year.Value);
    }

    var budgetMonths =
      await BudgetMonths
        .Find(filter)
        .ToListAsync();

    return budgetMonths
      .Select(budget =>
        budget.Id)
      .ToList();
  }

  /*===========================================================
    IsValidBillCategory:
    => Bills may ONLY use a Fixed Expense category.
    => Category must belong to the same budget month.

    Required:

    Type        = Expense
    ExpenseType = Fixed

    Bill.ExpectedAmount becomes the planned amount for the
    Fixed category.
  ===========================================================*/
  private static bool IsValidBillCategory(
    BudgetCategory category,
    string budgetMonthId)
  {
    var categoryType =
      BudgetCategoryTypes.Normalize(
        category.Type);

    var expenseType =
      ExpenseTypes.Normalize(
        category.ExpenseType);

    return
      category.BudgetMonthId ==
        budgetMonthId &&
      categoryType ==
        BudgetCategoryTypes.Expense &&
      expenseType ==
        ExpenseTypes.Fixed;
  }

  /*===========================================================
    IsDateInsideBudgetMonth:
    => Checks whether a bill due date belongs to the selected
       budget month.

    BudgetMonth.Month:
    January  = 1
    December = 12
  ===========================================================*/
  private static bool IsDateInsideBudgetMonth(
    DateTime date,
    int budgetMonth,
    int budgetYear)
  {
    return
      date.Month == budgetMonth &&
      date.Year == budgetYear;
  }
}