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
      AccountTransferId = null,
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
    => Deletes one bill.
    => Deletes its linked ExpenseRecord when it is an Expense bill.
    => Deletes its linked AccountTransfer when it is a Transfer bill.
    => Returns the deleted bill response.
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

    if (!string.IsNullOrWhiteSpace(
      bill.ExpenseRecordId))
    {
      await ExpenseRecords.DeleteOneAsync(
        expense =>
          expense.Id == bill.ExpenseRecordId &&
          expense.UserId == userId);
    }

    if (!string.IsNullOrWhiteSpace(
      bill.AccountTransferId))
    {
      await AccountTransfers.DeleteOneAsync(
        transfer =>
          transfer.Id == bill.AccountTransferId &&
          transfer.UserId == userId);
    }

    var result = await Bills.DeleteOneAsync(
      b =>
        b.Id == billId &&
        b.UserId == userId);

    if (result.DeletedCount == 0)
    {
      return null;
    }

    return deletedBill;
  }

  /*===========================================================
    MarkBillPaidAsync:
    => Marks a bill as paid.
    => Expense bills create an ExpenseRecord.
    => Transfer bills create an AccountTransfer.
    => Prevents already-paid bills from being paid twice.
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

    if (bill == null ||
        bill.IsPaid)
    {
      return null;
    }

    var sourceAccount =
      await GetAccountByIdAsync(
        request.AccountId,
        userId);

    if (sourceAccount == null)
    {
      return null;
    }

    if (bill.PaymentType ==
        BillPaymentTypes.Expense)
    {
      return await MarkExpenseBillPaidAsync(
        bill,
        sourceAccount,
        request,
        userId);
    }

    if (bill.PaymentType ==
        BillPaymentTypes.Transfer)
    {
      return await MarkTransferBillPaidAsync(
        bill,
        sourceAccount,
        request,
        userId);
    }

    return null;
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
          b => b.AccountTransferId,
          null)
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
      sourceAccount: sourceAccount);
  }

  /*===========================================================
    MarkTransferBillPaidAsync:
    => Creates an AccountTransfer for a credit-card payment bill.
    => Source account must be Checking or Savings.
    => Destination account must be CreditCard.
    => Does not create an ExpenseRecord.
  ===========================================================*/
  private async Task<BillResponse?> MarkTransferBillPaidAsync(
    Bill bill,
    FinancialAccount sourceAccount,
    MarkBillPaidRequest request,
    string userId)
  {
    if (!IsCashAccount(sourceAccount))
    {
      return null;
    }

    if (string.IsNullOrWhiteSpace(
      bill.DestinationAccountId))
    {
      return null;
    }

    var destinationAccount =
      await GetAccountByIdAsync(
        bill.DestinationAccountId,
        userId);

    if (destinationAccount == null ||
        !IsCreditCardAccount(
          destinationAccount))
    {
      return null;
    }

    if (sourceAccount.Id ==
        destinationAccount.Id)
    {
      return null;
    }

    var transfer = new AccountTransfer
    {
      UserId = userId,

      FromAccountId =
        sourceAccount.Id,

      ToAccountId =
        destinationAccount.Id,

      Amount =
        request.ActualAmount,

      TransferDate =
        request.PaidDate,

      Notes =
        request.Notes ??
        bill.Notes,

      CreatedAtUtc =
        DateTime.UtcNow
    };

    await AccountTransfers.InsertOneAsync(
      transfer);

    var billUpdate =
      Builders<Bill>.Update
        .Set(
          b => b.IsPaid,
          true)
        .Set(
          b => b.AccountTransferId,
          transfer.Id)
        .Set(
          b => b.ExpenseRecordId,
          null)
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
        Roll back the transfer if another operation
        already marked the bill as paid.
      */
      await AccountTransfers.DeleteOneAsync(
        t =>
          t.Id == transfer.Id &&
          t.UserId == userId);

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
      transfer: transfer,
      sourceAccount: sourceAccount,
      destinationAccount:
        destinationAccount);
  }

  /*===========================================================
    MarkBillUnpaidAsync:
    => Reverses a bill payment.
    => Expense bills delete their linked ExpenseRecord.
    => Transfer bills delete their linked AccountTransfer.
    => Resets the bill back to unpaid.
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

    if (bill == null ||
        !bill.IsPaid)
    {
      return null;
    }

    /*
      Reverse Expense bill payment.
    */
    if (!string.IsNullOrWhiteSpace(
      bill.ExpenseRecordId))
    {
      await ExpenseRecords.DeleteOneAsync(
        expense =>
          expense.Id == bill.ExpenseRecordId &&
          expense.UserId == userId);
    }

    /*
      Reverse Transfer bill payment.
    */
    if (!string.IsNullOrWhiteSpace(
      bill.AccountTransferId))
    {
      await AccountTransfers.DeleteOneAsync(
        transfer =>
          transfer.Id == bill.AccountTransferId &&
          transfer.UserId == userId);
    }

    var update =
      Builders<Bill>.Update
        .Set(
          b => b.IsPaid,
          false)
        .Unset(
          b => b.ExpenseRecordId)
        .Unset(
          b => b.AccountTransferId)
        .Unset(
          b => b.PaidDate);

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
    BuildBillResponseAsync:
    => Loads all information related to a bill.
    => Supports Expense and Transfer bills.
    => Adds category and account names to the response.
  ===========================================================*/
  private async Task<BillResponse> BuildBillResponseAsync(
    Bill bill,
    string userId)
  {
    BudgetCategory? category = null;
    ExpenseRecord? expense = null;
    AccountTransfer? transfer = null;

    FinancialAccount? sourceAccount = null;
    FinancialAccount? destinationAccount = null;

    /*
      Load Expense bill category.
    */
    if (!string.IsNullOrWhiteSpace(
      bill.BudgetCategoryId))
    {
      category = await BudgetCategories
        .Find(c =>
          c.Id == bill.BudgetCategoryId &&
          c.UserId == userId)
        .FirstOrDefaultAsync();
    }

    /*
      Load linked ExpenseRecord.
    */
    if (!string.IsNullOrWhiteSpace(
      bill.ExpenseRecordId))
    {
      expense = await ExpenseRecords
        .Find(e =>
          e.Id == bill.ExpenseRecordId &&
          e.UserId == userId)
        .FirstOrDefaultAsync();

      if (expense != null)
      {
        sourceAccount =
          await GetAccountByIdAsync(
            expense.AccountId,
            userId);
      }
    }

    /*
      Load linked AccountTransfer.
    */
    if (!string.IsNullOrWhiteSpace(
      bill.AccountTransferId))
    {
      transfer = await AccountTransfers
        .Find(t =>
          t.Id == bill.AccountTransferId &&
          t.UserId == userId)
        .FirstOrDefaultAsync();

      if (transfer != null)
      {
        sourceAccount =
          await GetAccountByIdAsync(
            transfer.FromAccountId,
            userId);

        destinationAccount =
          await GetAccountByIdAsync(
            transfer.ToAccountId,
            userId);
      }
    }

    /*
      Load destination account for an unpaid
      Transfer bill.
    */
    if (destinationAccount == null &&
        !string.IsNullOrWhiteSpace(
          bill.DestinationAccountId))
    {
      destinationAccount =
        await GetAccountByIdAsync(
          bill.DestinationAccountId,
          userId);
    }

    return BillMapper.ToResponse(
      bill,
      category,
      expense,
      transfer,
      sourceAccount,
      destinationAccount);
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