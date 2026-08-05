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
  Paid bills cannot be edited directly.

  A paid bill may have created its ExpenseRecord inside a
  different payment month. Editing it here could break that
  payment-month category relationship.

  Reverse the payment first, edit the bill, and then pay it
  again if necessary.
---------------------------------------------------------*/
    if (bill.IsPaid)
    {
      throw new InvalidOperationException(
        "A paid bill cannot be updated. Mark it unpaid first.");
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

    Bill month:
    => Remains the month when the bill was due.

    Expense month:
    => Uses the month containing PaidDate.

    Rules:
    => Bill must be unpaid.
    => ActualAmount must be greater than zero.
    => PaidDate cannot be in the future.
    => Payment may be up to 14 days before the bill month.
    => Late payments are allowed.
    => A BudgetMonth must exist for PaidDate.
    => A matching Fixed Expense category is found or created
       inside the payment month.
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
      Prevent duplicate payments.
    ---------------------------------------------------------*/
    if (bill.IsPaid)
    {
      throw new InvalidOperationException(
        "This bill has already been paid.");
    }

    /*---------------------------------------------------------
      Validate the payment account ID.
    ---------------------------------------------------------*/
    if (string.IsNullOrWhiteSpace(
      request.AccountId))
    {
      throw new ArgumentException(
        "Payment account is required.");
    }

    /*---------------------------------------------------------
      Actual amount must be positive.
    ---------------------------------------------------------*/
    if (request.ActualAmount <= 0)
    {
      throw new ArgumentException(
        "Actual amount must be greater than 0.");
    }

    /*---------------------------------------------------------
      Paid date is required.
    ---------------------------------------------------------*/
    if (request.PaidDate == default)
    {
      throw new ArgumentException(
        "Paid date is required.");
    }

    /*
      Normalize the payment date to a UTC calendar date.

      Time-of-day should not affect budget-month assignment.
    */
    var paidDate =
      DateTime.SpecifyKind(
        request.PaidDate.Date,
        DateTimeKind.Utc);

    /*---------------------------------------------------------
      Future payments are not allowed.

      Paying a bill means that money has already moved.
    ---------------------------------------------------------*/
    if (paidDate >
        DateTime.UtcNow.Date)
    {
      throw new ArgumentException(
        "Paid date cannot be in the future.");
    }

    /*---------------------------------------------------------
      Load the bill's original budget month.

      This remains the bill's obligation month.
    ---------------------------------------------------------*/
    var billBudgetMonth =
      await BudgetMonths
        .Find(budgetMonth =>
          budgetMonth.Id ==
            bill.BudgetMonthId &&
          budgetMonth.UserId ==
            userId)
        .FirstOrDefaultAsync();

    if (billBudgetMonth == null)
    {
      return null;
    }

    if (
      billBudgetMonth.Month < 1 ||
      billBudgetMonth.Month > 12)
    {
      throw new InvalidOperationException(
        "The bill's budget month contains an invalid month value.");
    }

    /*---------------------------------------------------------
      Keep the existing early-payment allowance.

      Example:

      August bill:
      Earliest allowed payment is 14 days before August 1.

      Unlike the previous version, there is no latest payment
      date. An overdue bill may be paid in a later month.
    ---------------------------------------------------------*/
    var billMonthStart =
      new DateTime(
        billBudgetMonth.Year,
        billBudgetMonth.Month,
        1,
        0,
        0,
        0,
        DateTimeKind.Utc);

    var earliestAllowedPaidDate =
      billMonthStart.AddDays(-14);

    if (paidDate <
        earliestAllowedPaidDate)
    {
      throw new ArgumentException(
        "Paid date cannot be more than 14 days before the bill's budget month.");
    }

    /*---------------------------------------------------------
      Find the budget month where the payment actually occurred.

      Example:

      July bill
      Paid August 4

      Bill month:
      July

      Expense month:
      August
    ---------------------------------------------------------*/
    var paymentBudgetMonth =
      await GetBudgetMonthForDateAsync(
        paidDate,
        userId);

    if (paymentBudgetMonth == null)
    {
      throw new ArgumentException(
        "A budget month must exist for the selected paid date.");
    }

    /*---------------------------------------------------------
      Load the payment account.
    ---------------------------------------------------------*/
    var paymentAccount =
      await GetAccountByIdAsync(
        request.AccountId,
        userId);

    if (paymentAccount == null)
    {
      throw new ArgumentException(
        "Payment account was not found.");
    }

    /*---------------------------------------------------------
      Load the bill's original category.

      This category remains attached to the original bill.
    ---------------------------------------------------------*/
    var originalCategory =
      await GetBudgetCategoryForMonthAsync(
        bill.BudgetCategoryId,
        bill.BudgetMonthId,
        userId);

    if (
      originalCategory == null ||
      !IsValidBillCategory(
        originalCategory,
        bill.BudgetMonthId)
    )
    {
      throw new InvalidOperationException(
        "The bill does not have a valid Fixed Expense category.");
    }

    /*---------------------------------------------------------
      Find or create the matching category in the month where
      the payment occurred.

      Same-month payment:
      => Usually returns the original category.

      Late payment:
      => Returns or creates the matching category in the later
         payment month.
    ---------------------------------------------------------*/
    var paymentCategory =
      await GetOrCreatePaymentCategoryAsync(
        originalCategory,
        paymentBudgetMonth,
        userId);

    /*---------------------------------------------------------
      Create the actual expense in the payment month.

      Important:

      BudgetMonthId:
      => Payment month

      CategoryId:
      => Matching category inside the payment month

      ExpenseDate:
      => Actual paid date
    ---------------------------------------------------------*/
    var expense =
      new ExpenseRecord
      {
        UserId =
          userId,

        BudgetMonthId =
          paymentBudgetMonth.Id,

        AccountId =
          paymentAccount.Id,

        CategoryId =
          paymentCategory.Id,

        Name =
          bill.Name,

        Amount =
          request.ActualAmount,

        ExpenseDate =
          paidDate,

        Notes =
          string.IsNullOrWhiteSpace(
            request.Notes)
            ? bill.Notes
            : request.Notes.Trim(),

        CreatedAtUtc =
          DateTime.UtcNow
      };

    await ExpenseRecords.InsertOneAsync(
      expense);

    /*---------------------------------------------------------
      Mark the original bill paid.

      The bill stays attached to its original due month, but
      ExpenseRecordId points to the payment-month expense.
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

    /*
      !IsPaid protects against two requests attempting to pay
      the same bill at the same time.
    */
    var updateResult =
      await Bills.UpdateOneAsync(
        existingBill =>
          existingBill.Id == bill.Id &&
          existingBill.UserId == userId &&
          !existingBill.IsPaid,
        billUpdate);

    if (updateResult.ModifiedCount == 0)
    {
      /*
        Roll back the expense if the bill could not transition
        to Paid.
      */
      await ExpenseRecords.DeleteOneAsync(
        expenseRecord =>
          expenseRecord.Id == expense.Id &&
          expenseRecord.UserId == userId);

      throw new InvalidOperationException(
        "The bill could not be marked paid because its status changed.");
    }

    /*---------------------------------------------------------
      Reload and return the updated bill.
    ---------------------------------------------------------*/
    var updatedBill =
      await Bills
        .Find(existingBill =>
          existingBill.Id == bill.Id &&
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
  GetBudgetMonthForDateAsync:
  => Finds the budget month containing a specific calendar
     date.

  Example:

  PaidDate:
  August 4, 2026

  Result:
  August 2026 BudgetMonth
===========================================================*/
  private async Task<BudgetMonth?>
    GetBudgetMonthForDateAsync(
      DateTime date,
      string userId)
  {
    return await BudgetMonths
      .Find(budgetMonth =>
        budgetMonth.UserId == userId &&
        budgetMonth.Month == date.Month &&
        budgetMonth.Year == date.Year)
      .FirstOrDefaultAsync();
  }

  /*===========================================================
    GetOrCreatePaymentCategoryAsync:
    => Finds the matching Fixed Expense category in the month
       where the payment occurred.

    => Creates the category when it does not exist.

    Example:

    July bill category:
    Utilities

    Paid in August:
    Find or create "Utilities" in August.
  ===========================================================*/
  private async Task<BudgetCategory>
    GetOrCreatePaymentCategoryAsync(
      BudgetCategory originalCategory,
      BudgetMonth paymentBudgetMonth,
      string userId)
  {
    var paymentMonthCategories =
      await BudgetCategories
        .Find(category =>
          category.UserId == userId &&
          category.BudgetMonthId ==
            paymentBudgetMonth.Id)
        .ToListAsync();

    /*
      Category names are compared without considering
      capitalization.

      Example:

      Utilities
      utilities
      UTILITIES
    */
    var existingCategory =
      paymentMonthCategories
        .FirstOrDefault(category =>
          string.Equals(
            category.Name.Trim(),
            originalCategory.Name.Trim(),
            StringComparison.OrdinalIgnoreCase));

    if (existingCategory != null)
    {
      /*
        A category with the same name may already exist, but
        it must still be a Fixed Expense category.
      */
      if (!IsValidBillCategory(
        existingCategory,
        paymentBudgetMonth.Id))
      {
        throw new InvalidOperationException(
          $"The payment month already contains a category named " +
          $"'{originalCategory.Name}', but it is not a Fixed Expense category.");
      }

      return existingCategory;
    }

    /*
      The payment month does not have the required category.

      PlannedAmount remains zero because this category is being
      created to record the actual late payment. Any current
      month's bill still contributes through BillPlannedAmount.
    */
    var paymentCategory =
      new BudgetCategory
      {
        UserId =
          userId,

        BudgetMonthId =
          paymentBudgetMonth.Id,

        Type =
          BudgetCategoryTypes.Expense,

        ExpenseType =
          ExpenseTypes.Fixed,

        Name =
          originalCategory.Name.Trim(),

        PlannedAmount =
          0,

        CreatedAtUtc =
          DateTime.UtcNow
      };

    try
    {
      await BudgetCategories.InsertOneAsync(
        paymentCategory);

      return paymentCategory;
    }
    catch (MongoWriteException exception)
      when (
        exception.WriteError?.Category ==
        ServerErrorCategory.DuplicateKey)
    {
      /*
        Another request may have created the category between
        our original search and insert attempt.

        Reload and reuse it when valid.
      */
      var categoryAfterDuplicate =
        await BudgetCategories
          .Find(category =>
            category.UserId == userId &&
            category.BudgetMonthId ==
              paymentBudgetMonth.Id &&
            category.Name ==
              originalCategory.Name.Trim())
          .FirstOrDefaultAsync();

      if (
        categoryAfterDuplicate == null ||
        !IsValidBillCategory(
          categoryAfterDuplicate,
          paymentBudgetMonth.Id)
      )
      {
        throw;
      }

      return categoryAfterDuplicate;
    }
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