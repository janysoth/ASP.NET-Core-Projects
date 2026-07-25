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
    => Future due dates are allowed.
  ===========================================================*/
  public async Task<BillResponse?> CreateBillAsync(
    string budgetMonthId,
    CreateBillRequest request,
    string userId)
  {
    var budgetMonth =
      await GetBudgetMonthModelByIdAsync(
        budgetMonthId,
        userId);

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
        "The bill due date must be within the selected budget month.");
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

      category =
        await GetBudgetCategoryForMonthAsync(
          request.BudgetCategoryId,
          budgetMonthId,
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

      BudgetMonthId =
        budgetMonthId,

      PaymentType =
        paymentType,

      BudgetCategoryId =
        paymentType ==
          BillPaymentTypes.Expense
          ? category?.Id
          : null,

      DestinationAccountId =
        paymentType ==
          BillPaymentTypes.Transfer
          ? destinationAccount?.Id
          : null,

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
      category: category,
      destinationAccount: destinationAccount);
  }

  /*===========================================================
    UpdateBillAsync:
    => Updates an unpaid bill's type and related account/category.
    => Expense bills must use an Expense category.
    => Transfer bills must use a CreditCard destination account.
    => Paid bills cannot change their payment structure.
    => Future due dates are allowed.
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

    var budgetMonth =
      await GetBudgetMonthModelByIdAsync(
        bill.BudgetMonthId,
        userId);

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
        "The bill due date must be within the selected budget month.");
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

      category =
        await GetBudgetCategoryForMonthAsync(
          request.BudgetCategoryId,
          bill.BudgetMonthId,
          userId);

      if (category == null ||
          !IsValidExpenseBillCategory(
            category,
            bill.BudgetMonthId))
      {
        return null;
      }

      /*
        If already paid, keep the linked ExpenseRecord
        synchronized when the bill name or category changes.
      */
      if (bill.IsPaid &&
          !string.IsNullOrWhiteSpace(
            bill.ExpenseRecordId))
      {
        var expenseUpdate =
          Builders<ExpenseRecord>.Update
            .Set(
              expense => expense.CategoryId,
              category.Id)
            .Set(
              expense => expense.Name,
              request.Name.Trim());

        await ExpenseRecords.UpdateOneAsync(
          expense =>
            expense.Id ==
              bill.ExpenseRecordId &&
            expense.UserId ==
              userId,
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

    var update =
      Builders<Bill>.Update
        .Set(
          b => b.PaymentType,
          paymentType)
        .Set(
          b => b.BudgetCategoryId,
          paymentType ==
            BillPaymentTypes.Expense
            ? category?.Id
            : null)
        .Set(
          b => b.DestinationAccountId,
          paymentType ==
            BillPaymentTypes.Transfer
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

    var result =
      await Bills.UpdateOneAsync(
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
    => Expense bills also delete the linked ExpenseRecord.
    => Transfer bills keep payment transfers as financial history.
    => Transfer payments are unlinked before deleting the bill.
  ===========================================================*/
  public async Task<BillResponse?> DeleteBillAsync(
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

    var deletedBill =
      await BuildBillResponseAsync(
        bill,
        userId);

    /*
      Expense Bill:
      Delete the automatically generated ExpenseRecord.
    */
    if (string.Equals(
      bill.PaymentType,
      BillPaymentTypes.Expense,
      StringComparison.OrdinalIgnoreCase) &&
      !string.IsNullOrWhiteSpace(
        bill.ExpenseRecordId))
    {
      await ExpenseRecords.DeleteOneAsync(
        expense =>
          expense.Id ==
            bill.ExpenseRecordId &&
          expense.UserId ==
            userId);
    }

    /*
      Transfer Bill:
      Preserve actual transfer history.

      Remove BillId so the transfers become
      standalone account transfers.
    */
    if (string.Equals(
      bill.PaymentType,
      BillPaymentTypes.Transfer,
      StringComparison.OrdinalIgnoreCase))
    {
      var unlinkTransfers =
        Builders<AccountTransfer>.Update
          .Unset(
            transfer =>
              transfer.BillId);

      await AccountTransfers.UpdateManyAsync(
        transfer =>
          transfer.UserId == userId &&
          transfer.BillId == bill.Id,
        unlinkTransfers);
    }

    var deleteResult =
      await Bills.DeleteOneAsync(
        b =>
          b.Id == billId &&
          b.UserId == userId);

    if (deleteResult.DeletedCount == 0)
    {
      return null;
    }

    return deletedBill;
  }

  /*===========================================================
    MarkBillPaidAsync:
    => Marks an Expense bill as paid.
    => Creates an ExpenseRecord for the payment.
    => Transfer bills must use the AccountTransfer endpoint.
    => PaidDate cannot be in the future.
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
      A payment represents money that has already moved.

      Future payment dates are therefore not allowed.
    */
    if (request.PaidDate.Date >
        DateTime.UtcNow.Date)
    {
      return null;
    }

    /*
      Transfer bills support multiple payments.

      Credit-card payments should use:

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
      Payment amount must be positive.
    */
    if (request.ActualAmount <= 0)
    {
      return null;
    }

    /*
      Load the account used to pay the expense.

      Expense bills may be paid from:
      - Checking
      - Savings
      - CreditCard
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
      Load the bill's Expense category and verify
      it still belongs to this budget month.
    */
    var category =
      await GetBudgetCategoryForMonthAsync(
        bill.BudgetCategoryId,
        bill.BudgetMonthId,
        userId);

    if (category == null ||
        !IsValidExpenseBillCategory(
          category,
          bill.BudgetMonthId))
    {
      return null;
    }

    /*
      Create the actual ExpenseRecord.
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

        CategoryId =
          category.Id,

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
      !b.IsPaid protects against two requests
      paying the same Expense bill at the same time.
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
      */
      await ExpenseRecords.DeleteOneAsync(
        e =>
          e.Id == expense.Id &&
          e.UserId == userId);

      return null;
    }

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

    return await BuildBillResponseAsync(
      updatedBill,
      userId);
  }

  /*===========================================================
    MarkExpenseBillPaidAsync:
    => Creates an ExpenseRecord for an Expense bill.
    => Allows payment from Checking, Savings, or CreditCard.
    => Links the created expense back to the bill.
    => PaidDate cannot be in the future.

    NOTE:
    => This helper currently duplicates some logic from
       MarkBillPaidAsync.
    => It can be removed or reused in a later cleanup refactor.
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

    if (request.PaidDate.Date >
        DateTime.UtcNow.Date)
    {
      return null;
    }

    if (request.ActualAmount <= 0)
    {
      return null;
    }

    var category =
      await GetBudgetCategoryForMonthAsync(
        bill.BudgetCategoryId,
        bill.BudgetMonthId,
        userId);

    if (category == null ||
        !IsValidExpenseBillCategory(
          category,
          bill.BudgetMonthId))
    {
      return null;
    }

    var expense =
      new ExpenseRecord
      {
        UserId =
          userId,

        BudgetMonthId =
          bill.BudgetMonthId,

        AccountId =
          sourceAccount.Id,

        CategoryId =
          category.Id,

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
      await ExpenseRecords.DeleteOneAsync(
        e =>
          e.Id == expense.Id &&
          e.UserId == userId);

      return null;
    }

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
    => Transfer bills are reversed by deleting individual
       AccountTransfer records instead.
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

      Delete a specific transfer using:

      DELETE /api/budget/transfers/{transferId}
    */
    if (string.Equals(
      bill.PaymentType,
      BillPaymentTypes.Transfer,
      StringComparison.OrdinalIgnoreCase))
    {
      return null;
    }

    if (!bill.IsPaid)
    {
      return null;
    }

    if (string.IsNullOrWhiteSpace(
      bill.ExpenseRecordId))
    {
      return null;
    }

    /*
      Delete the ExpenseRecord created when the bill was paid.

      This reverses:
      - transaction history;
      - category spending;
      - account balance impact.
    */
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

    /*
      Reset the bill back to unpaid.
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
    => Transfer bills load all linked AccountTransfers.
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

    /*
      Expense Bill:
      Load the linked budget category.
    */
    if (string.Equals(
      bill.PaymentType,
      BillPaymentTypes.Expense,
      StringComparison.OrdinalIgnoreCase) &&
      !string.IsNullOrWhiteSpace(
        bill.BudgetCategoryId))
    {
      category =
        await GetCategoryByIdAsync(
          bill.BudgetCategoryId,
          userId);
    }

    /*
      Expense Bill Payment:
      Load the ExpenseRecord and its payment account.
    */
    if (string.Equals(
      bill.PaymentType,
      BillPaymentTypes.Expense,
      StringComparison.OrdinalIgnoreCase) &&
      !string.IsNullOrWhiteSpace(
        bill.ExpenseRecordId))
    {
      expense =
        await ExpenseRecords
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

    /*
      Transfer Bill:
      Load the destination CreditCard account.
    */
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

    /*
      Transfer Bill Payments:
      Load all transfers linked to this bill.
    */
    if (string.Equals(
      bill.PaymentType,
      BillPaymentTypes.Transfer,
      StringComparison.OrdinalIgnoreCase))
    {
      linkedTransfers =
        await AccountTransfers
          .Find(t =>
            t.UserId == userId &&
            t.BillId == bill.Id)
          .SortBy(t =>
            t.TransferDate)
          .ThenBy(t =>
            t.CreatedAtUtc)
          .ToListAsync();

      /*
        Collect account IDs used by linked payments.
      */
      var accountIds =
        linkedTransfers
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
        Include the configured destination account even when
        the bill has not received a payment yet.
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
        var accounts =
          await FinancialAccounts
            .Find(a =>
              a.UserId == userId &&
              accountIds.Contains(a.Id))
            .ToListAsync();

        accountLookup =
          accounts.ToDictionary(
            a => a.Id,
            a => a);

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
    var categoryType =
      BudgetCategoryTypes.Normalize(
        category.Type);

    return
      category.BudgetMonthId ==
        budgetMonthId &&
      categoryType ==
        BudgetCategoryTypes.Expense;
  }

  /*===========================================================
    IsCreditCardAccount:
    => Checks whether the account is a CreditCard account.
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
    IsDateInsideBudgetMonth:
    => Checks whether a due date belongs to the bill's
       selected budget month.
    => BudgetMonth.Month uses normal calendar months:
       January = 1 through December = 12.
    => DateTime.Month uses the same 1-12 format.
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