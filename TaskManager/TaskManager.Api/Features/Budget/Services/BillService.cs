using MongoDB.Driver;
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

    if (month.HasValue || year.HasValue)
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

    var bills = await Bills
      .Find(filter)
      .SortBy(bill => bill.DueDate)
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
    => Ensures the bill belongs to the logged-in user.
    => Returns the complete bill response.
  ===========================================================*/
  public async Task<BillResponse?> GetBillByIdAsync(
    string billId,
    string userId)
  {
    var bill = await Bills
      .Find(b =>
        b.Id == billId &&
        b.UserId == userId)
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
    => Creates either an Expense bill or Transfer bill.
    => Expense bills require a valid Expense category.
    => Transfer bills require a CreditCard destination account.
    => The due date must belong to the selected budget month.
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

    var paymentType =
      BillPaymentTypes.Normalize(
        request.PaymentType);

    if (paymentType == null)
    {
      return null;
    }

    BudgetCategory? category = null;
    FinancialAccount? destinationAccount = null;

    /*
      Expense Bill:
      Requires an Expense budget category.
    */
    if (paymentType == BillPaymentTypes.Expense)
    {
      if (string.IsNullOrWhiteSpace(
        request.BudgetCategoryId))
      {
        return null;
      }

      category = await GetCategoryByIdAsync(
        request.BudgetCategoryId,
        userId);

      if (category == null ||
          !IsValidExpenseBillCategory(
            category,
            budgetMonthId))
      {
        return null;
      }
    }

    /*
      Transfer Bill:
      Requires a CreditCard destination account.
    */
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

    var bill = new Bill
    {
      UserId = userId,
      BudgetMonthId = budgetMonthId,

      PaymentType = paymentType,

      BudgetCategoryId =
        paymentType == BillPaymentTypes.Expense
          ? category?.Id
          : null,

      DestinationAccountId =
        paymentType == BillPaymentTypes.Transfer
          ? destinationAccount?.Id
          : null,

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
      category: category,
      destinationAccount: destinationAccount);
  }

  /*===========================================================
    UpdateBillAsync:
    => Updates an unpaid bill's type and related account/category.
    => Expense bills must use an Expense category.
    => Transfer bills must use a CreditCard destination account.
    => Paid bills cannot change their payment structure.
  ===========================================================*/
  public async Task<BillResponse?> UpdateBillAsync(
    string billId,
    UpdateBillRequest request,
    string userId)
  {
    var bill = await Bills
      .Find(b =>
        b.Id == billId &&
        b.UserId == userId)
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

    var paymentType =
      BillPaymentTypes.Normalize(
        request.PaymentType);

    if (paymentType == null)
    {
      return null;
    }

    /*
      Once paid, do not allow the bill to change from
      Expense → Transfer or Transfer → Expense.

      That would make the linked financial transaction invalid.
    */
    if (bill.IsPaid &&
        !string.Equals(
          bill.PaymentType,
          paymentType,
          StringComparison.OrdinalIgnoreCase))
    {
      return null;
    }

    BudgetCategory? category = null;
    FinancialAccount? destinationAccount = null;

    if (paymentType == BillPaymentTypes.Expense)
    {
      if (string.IsNullOrWhiteSpace(
        request.BudgetCategoryId))
      {
        return null;
      }

      category = await GetCategoryByIdAsync(
        request.BudgetCategoryId,
        userId);

      if (category == null ||
          !IsValidExpenseBillCategory(
            category,
            bill.BudgetMonthId))
      {
        return null;
      }

      /*
        If already paid, keep the linked expense synchronized
        when the bill name or category changes.
      */
      if (bill.IsPaid &&
          !string.IsNullOrWhiteSpace(
            bill.ExpenseRecordId))
      {
        var expenseUpdate =
          Builders<ExpenseRecord>.Update
            .Set(
              expense => expense.Category,
              category.Name)
            .Set(
              expense => expense.Name,
              request.Name.Trim());

        await ExpenseRecords.UpdateOneAsync(
          expense =>
            expense.Id == bill.ExpenseRecordId &&
            expense.UserId == userId,
          expenseUpdate);
      }
    }

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

      /*
        Do not allow changing the destination credit card
        after a payment transfer already exists.

        The bill should first be marked unpaid,
        then updated, then paid again.
      */
      if (bill.IsPaid &&
          !string.Equals(
            bill.DestinationAccountId,
            destinationAccount.Id,
            StringComparison.Ordinal))
      {
        return null;
      }
    }

    var update = Builders<Bill>.Update
      .Set(
        b => b.PaymentType,
        paymentType)
      .Set(
        b => b.BudgetCategoryId,
        paymentType == BillPaymentTypes.Expense
          ? category?.Id
          : null)
      .Set(
        b => b.DestinationAccountId,
        paymentType == BillPaymentTypes.Transfer
          ? destinationAccount?.Id
          : null)
      .Set(
        b => b.Name,
        request.Name.Trim())
      .Set(
        b => b.ExpectedAmount,
        request.ExpectedAmount)
      .Set(
        b => b.DueDate,
        request.DueDate)
      .Set(
        b => b.Notes,
        request.Notes);

    var result = await Bills.UpdateOneAsync(
      b =>
        b.Id == billId &&
        b.UserId == userId,
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
    => Deletes one bill owned by the logged-in user.
    => Expense bills also delete the linked ExpenseRecord
       automatically created when the bill was paid.
    => Transfer bills do NOT delete payment transfers.
    => Transfer payments are real financial history, so they are
       unlinked from the bill before the bill is deleted.
    => Returns the deleted bill information.
  ===========================================================*/
  public async Task<BillResponse?> DeleteBillAsync(
    string billId,
    string userId)
  {
    /*
      Load the bill first.

      We need the full bill information before deleting it so we can:
      - determine whether it is an Expense or Transfer bill;
      - reverse/unlink related records correctly;
      - return the deleted bill response.
    */
    var bill = await Bills
      .Find(b =>
        b.Id == billId &&
        b.UserId == userId)
      .FirstOrDefaultAsync();

    if (bill == null)
    {
      return null;
    }

    /*
      Build the response before changing any linked records.

      For Transfer bills, this response may include:
      - total paid;
      - remaining amount;
      - payment count;
      - individual linked payments.
    */
    var deletedBill =
      await BuildBillResponseAsync(
        bill,
        userId);

    /*===========================================================
      Expense Bill:
      => Delete the linked ExpenseRecord.

      Expense bill payments were automatically created by the bill,
      so deleting the bill should also remove that generated expense.

      This reverses:
      - category actual spending;
      - account balance impact;
      - transaction history entry.
    ===========================================================*/
    if (string.Equals(
      bill.PaymentType,
      BillPaymentTypes.Expense,
      StringComparison.OrdinalIgnoreCase) &&
      !string.IsNullOrWhiteSpace(
        bill.ExpenseRecordId))
    {
      await ExpenseRecords.DeleteOneAsync(
        expense =>
          expense.Id == bill.ExpenseRecordId &&
          expense.UserId == userId);
    }

    /*===========================================================
      Transfer Bill:
      => Do NOT delete linked AccountTransfers.

      Credit-card payments are real financial transactions.

      Example:

      July Capital One Bill
        Payment 1: $250
        Payment 2: $250

      If the bill reminder is deleted, those two transfers should
      remain in account history.

      Instead, remove BillId from the transfers so they become
      normal standalone account transfers.
    ===========================================================*/
    if (string.Equals(
      bill.PaymentType,
      BillPaymentTypes.Transfer,
      StringComparison.OrdinalIgnoreCase))
    {
      var unlinkTransfers =
        Builders<AccountTransfer>.Update
          .Unset(
            transfer => transfer.BillId);

      await AccountTransfers.UpdateManyAsync(
        transfer =>
          transfer.UserId == userId &&
          transfer.BillId == bill.Id,
        unlinkTransfers);
    }

    /*
      Delete the Bill document itself.
    */
    var deleteResult =
      await Bills.DeleteOneAsync(
        b =>
          b.Id == billId &&
          b.UserId == userId);

    if (deleteResult.DeletedCount == 0)
    {
      return null;
    }

    /*
      Return the bill information as it existed
      immediately before deletion.
    */
    return deletedBill;
  }

  /*===========================================================
   MarkBillPaidAsync:
   => Marks an Expense bill as paid.
   => Creates an ExpenseRecord for the payment.
   => Transfer bills are no longer paid through this method.
   => Credit-card payments must use the account transfer endpoint.
 ===========================================================*/
  public async Task<BillResponse?> MarkBillPaidAsync(
    string billId,
    MarkBillPaidRequest request,
    string userId)
  {
    var bill = await Bills
      .Find(b =>
        b.Id == billId &&
        b.UserId == userId)
      .FirstOrDefaultAsync();

    if (bill == null)
    {
      return null;
    }

    /*
      Transfer bills support multiple payments.

      They should not use MarkBillPaidAsync because this method
      represents a single Expense bill payment.

      Credit-card payments should instead use:

      POST /api/budget/transfers

      with an optional BillId.
    */
    if (string.Equals(
      bill.PaymentType,
      BillPaymentTypes.Transfer,
      StringComparison.OrdinalIgnoreCase))
    {
      return null;
    }

    /*
      Expense bills can only be paid once.

      Their payment creates one linked ExpenseRecord.
    */
    if (bill.IsPaid)
    {
      return null;
    }

    /*
      Expense bills must have a valid BudgetCategoryId.
    */
    if (string.IsNullOrWhiteSpace(
      bill.BudgetCategoryId))
    {
      return null;
    }

    /*
      Load the account that will pay the expense.

      Expense bills may be paid from:
      - Checking
      - Savings
      - CreditCard

      Example:
      Internet paid from Checking
      Groceries paid using CreditCard
    */
    var paymentAccount =
      await GetAccountByIdAsync(
        request.AccountId,
        userId);

    if (paymentAccount == null)
    {
      return null;
    }

    /*
      Load the bill's Expense category.
    */
    var category =
      await GetCategoryByIdAsync(
        bill.BudgetCategoryId,
        userId);

    if (category == null)
    {
      return null;
    }

    /*
      Ensure the category is still valid for this bill.

      It must:
      - belong to the same budget month;
      - have Type = Expense.
    */
    if (!IsValidExpenseBillCategory(
      category,
      bill.BudgetMonthId))
    {
      return null;
    }

    /*
      Create the actual ExpenseRecord.

      This is the financial transaction that affects:
      - category spending;
      - account balance;
      - transaction history.
    */
    var expense =
      new ExpenseRecord
      {
        UserId =
          userId,

        BudgetMonthId =
          bill.BudgetMonthId,

        AccountId =
          paymentAccount.Id,

        Category =
          category.Name,

        Name =
          bill.Name,

        Amount =
          request.ActualAmount,

        ExpenseDate =
          request.PaidDate,

        Notes =
          request.Notes ??
          bill.Notes,

        CreatedAtUtc =
          DateTime.UtcNow
      };

    await ExpenseRecords.InsertOneAsync(
      expense);

    /*
      Mark the bill as paid and link the created ExpenseRecord.
    */
    var billUpdate =
      Builders<Bill>.Update
        .Set(
          b => b.IsPaid,
          true)
        .Set(
          b => b.ExpenseRecordId,
          expense.Id)
        .Set(
          b => b.PaidDate,
          request.PaidDate);

    /*
      The !b.IsPaid condition helps prevent the same Expense bill
      from being paid twice if two requests happen close together.
    */
    var updateResult =
      await Bills.UpdateOneAsync(
        b =>
          b.Id == bill.Id &&
          b.UserId == userId &&
          !b.IsPaid,
        billUpdate);

    if (updateResult.ModifiedCount == 0)
    {
      /*
        Roll back the ExpenseRecord if the bill could not
        successfully transition to Paid.

        This prevents an orphaned duplicate expense.
      */
      await ExpenseRecords.DeleteOneAsync(
        e =>
          e.Id == expense.Id &&
          e.UserId == userId);

      return null;
    }

    /*
      Reload the updated bill.
    */
    var updatedBill =
      await Bills
        .Find(b =>
          b.Id == bill.Id &&
          b.UserId == userId)
        .FirstOrDefaultAsync();

    if (updatedBill == null)
    {
      return null;
    }

    /*
      Build the latest response.

      BuildBillResponseAsync now understands:
      - Expense bills with one ExpenseRecord;
      - Transfer bills with multiple linked AccountTransfers.
    */
    return await BuildBillResponseAsync(
      updatedBill,
      userId);
  }

  /*===========================================================
    MarkExpenseBillPaidAsync:
    => Creates an ExpenseRecord for an Expense bill.
    => Allows payment from Checking, Savings, or CreditCard.
    => Links the created expense back to the bill.
  ===========================================================*/
  private async Task<BillResponse?> MarkExpenseBillPaidAsync(
    Bill bill,
    FinancialAccount sourceAccount,
    MarkBillPaidRequest request,
    string userId)
  {
    if (string.IsNullOrWhiteSpace(
      bill.BudgetCategoryId))
    {
      return null;
    }

    var category = await GetCategoryByIdAsync(
      bill.BudgetCategoryId,
      userId);

    if (category == null ||
        !IsValidExpenseBillCategory(
          category,
          bill.BudgetMonthId))
    {
      return null;
    }

    var expense = new ExpenseRecord
    {
      UserId = userId,
      BudgetMonthId = bill.BudgetMonthId,

      AccountId = sourceAccount.Id,

      Category = category.Name,
      Name = bill.Name,

      Amount = request.ActualAmount,
      ExpenseDate = request.PaidDate,

      Notes =
        request.Notes ??
        bill.Notes,

      CreatedAtUtc =
        DateTime.UtcNow
    };

    await ExpenseRecords.InsertOneAsync(
      expense);

    var billUpdate =
      Builders<Bill>.Update
        .Set(
          b => b.IsPaid,
          true)
        .Set(
          b => b.ExpenseRecordId,
          expense.Id)
        .Set(
          b => b.PaidDate,
          request.PaidDate);

    var updateResult =
      await Bills.UpdateOneAsync(
        b =>
          b.Id == bill.Id &&
          b.UserId == userId &&
          !b.IsPaid,
        billUpdate);

    if (updateResult.ModifiedCount == 0)
    {
      /*
        Roll back the expense if another operation
        paid the bill before this update completed.
      */
      await ExpenseRecords.DeleteOneAsync(
        e =>
          e.Id == expense.Id &&
          e.UserId == userId);

      return null;
    }

    var updatedBill = await Bills
      .Find(b =>
        b.Id == bill.Id &&
        b.UserId == userId)
      .FirstOrDefaultAsync();

    if (updatedBill == null)
    {
      return null;
    }

    return BillMapper.ToResponse(
      updatedBill,
      category: category,
      expense: expense,
      transfers: null,
      expenseAccount: sourceAccount,
      destinationAccount: null,
      accountLookup: null);
  }

  /*===========================================================
    MarkBillUnpaidAsync:
    => Reverses the payment for an Expense bill.
    => Deletes the linked ExpenseRecord.
    => Transfer bills are not handled here because they can have
       multiple payments linked through AccountTransfer.BillId.
    => Transfer payments should be reversed by deleting the
       individual AccountTransfer instead.
  ===========================================================*/
  public async Task<BillResponse?> MarkBillUnpaidAsync(
    string billId,
    string userId)
  {
    var bill = await Bills
      .Find(b =>
        b.Id == billId &&
        b.UserId == userId)
      .FirstOrDefaultAsync();

    if (bill == null)
    {
      return null;
    }

    /*
      Transfer bills can have multiple payments.

      Example:
      Payment 1 = $250
      Payment 2 = $250

      Because there may be more than one linked transfer,
      this method should not delete them all automatically.

      Instead, delete a specific transfer using:

      DELETE /api/budget/transfers/{transferId}
    */
    if (string.Equals(
      bill.PaymentType,
      BillPaymentTypes.Transfer,
      StringComparison.OrdinalIgnoreCase))
    {
      return null;
    }

    /*
      Expense bills must already be paid before
      they can be marked unpaid.
    */
    if (!bill.IsPaid)
    {
      return null;
    }

    /*
      Expense bills should have a linked ExpenseRecord.

      If the field is missing, the bill data is inconsistent,
      so we stop instead of changing the bill state.
    */
    if (string.IsNullOrWhiteSpace(
      bill.ExpenseRecordId))
    {
      return null;
    }

    /*
      Delete the ExpenseRecord created when the bill was paid.

      This automatically reverses:
      - the expense in transaction history;
      - the category's actual spending;
      - the account balance effect.
    */
    var deleteResult =
      await ExpenseRecords.DeleteOneAsync(
        expense =>
          expense.Id == bill.ExpenseRecordId &&
          expense.UserId == userId);

    if (deleteResult.DeletedCount == 0)
    {
      return null;
    }

    /*
      Reset the bill back to unpaid.

      Remove:
      - ExpenseRecordId
      - PaidDate

      IsPaid becomes false.
    */
    var update =
      Builders<Bill>.Update
        .Set(
          b => b.IsPaid,
          false)
        .Unset(
          b => b.ExpenseRecordId)
        .Unset(
          b => b.PaidDate);

    var updateResult =
      await Bills.UpdateOneAsync(
        b =>
          b.Id == billId &&
          b.UserId == userId,
        update);

    if (updateResult.MatchedCount == 0)
    {
      return null;
    }

    /*
      Reload the bill and build the latest response.
    */
    var updatedBill =
      await Bills
        .Find(b =>
          b.Id == billId &&
          b.UserId == userId)
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
    => Expense bills load their category, ExpenseRecord,
       and payment account.
    => Transfer bills load all linked AccountTransfers so one bill
       can track multiple credit-card payments.
    => Loads account names used by those payments.
  ===========================================================*/
  private async Task<BillResponse> BuildBillResponseAsync(
    Bill bill,
    string userId)
  {
    BudgetCategory? category = null;
    ExpenseRecord? expense = null;
    FinancialAccount? expenseAccount = null;
    FinancialAccount? destinationAccount = null;

    var linkedTransfers =
      new List<AccountTransfer>();

    var accountLookup =
      new Dictionary<string, FinancialAccount>();

    /*===========================================================
      Expense Bill:
      => Load the linked budget category.
    ===========================================================*/
    if (string.Equals(
      bill.PaymentType,
      BillPaymentTypes.Expense,
      StringComparison.OrdinalIgnoreCase) &&
      !string.IsNullOrWhiteSpace(
        bill.BudgetCategoryId))
    {
      category = await BudgetCategories
        .Find(c =>
          c.Id == bill.BudgetCategoryId &&
          c.UserId == userId)
        .FirstOrDefaultAsync();
    }

    /*===========================================================
      Expense Bill Payment:
      => Load the ExpenseRecord created when the bill was paid.
      => Load the financial account used to pay the expense.
    ===========================================================*/
    if (string.Equals(
      bill.PaymentType,
      BillPaymentTypes.Expense,
      StringComparison.OrdinalIgnoreCase) &&
      !string.IsNullOrWhiteSpace(
        bill.ExpenseRecordId))
    {
      expense = await ExpenseRecords
        .Find(e =>
          e.Id == bill.ExpenseRecordId &&
          e.UserId == userId)
        .FirstOrDefaultAsync();

      if (expense != null)
      {
        expenseAccount =
          await GetAccountByIdAsync(
            expense.AccountId,
            userId);
      }
    }

    /*===========================================================
      Transfer Bill:
      => Load the destination CreditCard account.
      => This is available whether the bill is paid or unpaid.
    ===========================================================*/
    if (string.Equals(
      bill.PaymentType,
      BillPaymentTypes.Transfer,
      StringComparison.OrdinalIgnoreCase) &&
      !string.IsNullOrWhiteSpace(
        bill.DestinationAccountId))
    {
      destinationAccount =
        await GetAccountByIdAsync(
          bill.DestinationAccountId,
          userId);
    }

    /*===========================================================
      Transfer Bill Payments:
      => Load every transfer linked to this bill.
      => Multiple payments can reference the same BillId.
      => Sort payments from oldest to newest.
    ===========================================================*/
    if (string.Equals(
      bill.PaymentType,
      BillPaymentTypes.Transfer,
      StringComparison.OrdinalIgnoreCase))
    {
      linkedTransfers = await AccountTransfers
        .Find(t =>
          t.UserId == userId &&
          t.BillId == bill.Id)
        .SortBy(t => t.TransferDate)
        .ThenBy(t => t.CreatedAtUtc)
        .ToListAsync();

      /*=========================================================
        Payment Accounts:
        => Collect all source and destination account IDs used
           by the linked transfers.
        => Load them in one MongoDB query instead of querying
           each payment separately.
      =========================================================*/
      var accountIds = linkedTransfers
        .SelectMany(t => new[]
        {
        t.FromAccountId,
        t.ToAccountId
        })
        .Where(id =>
          !string.IsNullOrWhiteSpace(id))
        .Distinct()
        .ToList();

      /*
        Also include the bill's configured destination account.

        This ensures the destination account name is available
        even when the Transfer bill has no payments yet.
      */
      if (!string.IsNullOrWhiteSpace(
        bill.DestinationAccountId) &&
        !accountIds.Contains(
          bill.DestinationAccountId))
      {
        accountIds.Add(
          bill.DestinationAccountId);
      }

      if (accountIds.Count > 0)
      {
        var accounts = await FinancialAccounts
          .Find(a =>
            a.UserId == userId &&
            accountIds.Contains(a.Id))
          .ToListAsync();

        accountLookup =
          accounts.ToDictionary(
            a => a.Id,
            a => a);

        /*
          Use the account loaded in the batch query when possible.
        */
        if (!string.IsNullOrWhiteSpace(
          bill.DestinationAccountId) &&
          accountLookup.TryGetValue(
            bill.DestinationAccountId,
            out var loadedDestinationAccount))
        {
          destinationAccount =
            loadedDestinationAccount;
        }
      }
    }

    /*===========================================================
      Build Response:
      => Expense bill:
         - category
         - expense
         - expense payment account

      => Transfer bill:
         - all linked transfers
         - destination CreditCard account
         - account lookup for individual payment details
    ===========================================================*/
    return BillMapper.ToResponse(
      bill,
      category: category,
      expense: expense,
      transfers: linkedTransfers,
      expenseAccount: expenseAccount,
      destinationAccount: destinationAccount,
      accountLookup: accountLookup);
  }
  /*===========================================================
    GetBudgetMonthIdsAsync:
    => Finds budget month IDs matching optional month/year filters.
  ===========================================================*/
  private async Task<List<string>> GetBudgetMonthIdsAsync(
    string userId,
    int? month,
    int? year)
  {
    var filter =
      Builders<BudgetMonth>.Filter.Eq(
        budget => budget.UserId,
        userId);

    if (month.HasValue)
    {
      filter &=
        Builders<BudgetMonth>.Filter.Eq(
          budget => budget.Month,
          month.Value);
    }

    if (year.HasValue)
    {
      filter &=
        Builders<BudgetMonth>.Filter.Eq(
          budget => budget.Year,
          year.Value);
    }

    var budgetMonths =
      await BudgetMonths
        .Find(filter)
        .ToListAsync();

    return budgetMonths
      .Select(b => b.Id)
      .ToList();
  }

  /*===========================================================
    IsValidExpenseBillCategory:
    => Expense bills can only use Expense categories.
    => Category must belong to the same budget month.
  ===========================================================*/
  private static bool IsValidExpenseBillCategory(
    BudgetCategory category,
    string budgetMonthId)
  {
    return
      category.BudgetMonthId ==
        budgetMonthId &&
      string.Equals(
        category.Type,
        BudgetCategoryTypes.Expense,
        StringComparison.OrdinalIgnoreCase);
  }

  /*===========================================================
    IsCreditCardAccount:
    => Checks whether an account is a CreditCard account.
  ===========================================================*/
  private static bool IsCreditCardAccount(
    FinancialAccount account)
  {
    return string.Equals(
      account.Type,
      FinancialAccountTypes.CreditCard,
      StringComparison.OrdinalIgnoreCase);
  }

  /*===========================================================
    IsCashAccount:
    => Checks whether an account can be used as the source
       of a credit-card payment.
    => Only Checking and Savings accounts are allowed.
  ===========================================================*/
  private static bool IsCashAccount(
    FinancialAccount account)
  {
    return
      string.Equals(
        account.Type,
        FinancialAccountTypes.Checking,
        StringComparison.OrdinalIgnoreCase) ||
      string.Equals(
        account.Type,
        FinancialAccountTypes.Savings,
        StringComparison.OrdinalIgnoreCase);
  }

  /*===========================================================
    IsDateInsideBudgetMonth:
    => Checks whether a due date belongs to the bill's
       selected budget month.
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