using MongoDB.Driver;
using TaskManager.Api.Features.Budget.DTOs.Admin;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

public class BudgetAdminService : BudgetBaseService
{
  /*===========================================================
    BudgetAdminService Constructor
  ===========================================================*/
  public BudgetAdminService(
    IMongoDatabase database)
    : base(database)
  {
  }

  /*===========================================================
    DeleteAllTransactionsAsync:
    => Deletes all income, expenses, and transfers.
    => Transactions are financial activity records.
    => Bills, accounts, months, and categories are preserved.
  ===========================================================*/
  public async Task<DeleteBudgetGroupResponse>
    DeleteAllTransactionsAsync(
      string userId)
  {
    var incomeResult =
      await IncomeRecords.DeleteManyAsync(
        income =>
          income.UserId == userId);

    var expenseResult =
      await ExpenseRecords.DeleteManyAsync(
        expense =>
          expense.UserId == userId);

    var transferResult =
      await AccountTransfers.DeleteManyAsync(
        transfer =>
          transfer.UserId == userId);

    return new DeleteBudgetGroupResponse
    {
      Group =
        "Transactions",

      DeletedIncomeRecords =
        incomeResult.DeletedCount,

      DeletedExpenseRecords =
        expenseResult.DeletedCount,

      DeletedTransfers =
        transferResult.DeletedCount,

      DeletedCount =
        incomeResult.DeletedCount +
        expenseResult.DeletedCount +
        transferResult.DeletedCount
    };
  }

  /*===========================================================
    DeleteAllTransfersAsync:
    => Deletes every account transfer for the current user.
    => This also removes all transfer-based bill payments.
  ===========================================================*/
  public async Task<DeleteBudgetGroupResponse>
    DeleteAllTransfersAsync(
      string userId)
  {
    var result =
      await AccountTransfers.DeleteManyAsync(
        transfer =>
          transfer.UserId == userId);

    return new DeleteBudgetGroupResponse
    {
      Group =
        "Transfers",

      DeletedTransfers =
        result.DeletedCount,

      DeletedCount =
        result.DeletedCount
    };
  }

  /*===========================================================
    DeleteAllIncomeAsync:
    => Deletes every income record for the current user.
  ===========================================================*/
  public async Task<DeleteBudgetGroupResponse>
    DeleteAllIncomeAsync(
      string userId)
  {
    var result =
      await IncomeRecords.DeleteManyAsync(
        income =>
          income.UserId == userId);

    return new DeleteBudgetGroupResponse
    {
      Group =
        "Income",

      DeletedIncomeRecords =
        result.DeletedCount,

      DeletedCount =
        result.DeletedCount
    };
  }

  /*===========================================================
    DeleteAllExpensesAsync:
    => Deletes every expense record for the current user.
    => Expense bill payment history is removed.
  ===========================================================*/
  public async Task<DeleteBudgetGroupResponse>
    DeleteAllExpensesAsync(
      string userId)
  {
    var result =
      await ExpenseRecords.DeleteManyAsync(
        expense =>
          expense.UserId == userId);

    return new DeleteBudgetGroupResponse
    {
      Group =
        "Expenses",

      DeletedExpenseRecords =
        result.DeletedCount,

      DeletedCount =
        result.DeletedCount
    };
  }

  /*===========================================================
    DeleteAllBillsAsync:
    => Deletes every bill for the current user.
    => Preserves account transfers.
    => Unlinks transfers by removing Transfer.BillId.
    => Preserves recurring templates.
  ===========================================================*/
  public async Task<DeleteBudgetGroupResponse>
    DeleteAllBillsAsync(
      string userId)
  {
    var userBills =
      await Bills
        .Find(bill =>
          bill.UserId == userId)
        .Project(bill =>
          bill.Id)
        .ToListAsync();

    long unlinkedTransfers = 0;

    if (userBills.Count > 0)
    {
      var transferFilter =
        Builders<AccountTransfer>.Filter.And(
          Builders<AccountTransfer>.Filter.Eq(
            transfer => transfer.UserId,
            userId),
          Builders<AccountTransfer>.Filter.In(
            transfer => transfer.BillId,
            userBills));

      var transferUpdate =
        Builders<AccountTransfer>.Update
          .Unset(
            transfer =>
              transfer.BillId);

      var unlinkResult =
        await AccountTransfers.UpdateManyAsync(
          transferFilter,
          transferUpdate);

      unlinkedTransfers =
        unlinkResult.ModifiedCount;
    }

    var billResult =
      await Bills.DeleteManyAsync(
        bill =>
          bill.UserId == userId);

    return new DeleteBudgetGroupResponse
    {
      Group =
        "Bills",

      DeletedBills =
        billResult.DeletedCount,

      UnlinkedTransfers =
        unlinkedTransfers,

      DeletedCount =
        billResult.DeletedCount
    };
  }

  /*===========================================================
    DeleteAllRecurringTemplatesAsync:
    => Deletes recurring bill templates.
    => Preserves generated bills.
    => Removes template links from existing bills.
  ===========================================================*/
  public async Task<DeleteBudgetGroupResponse>
    DeleteAllRecurringTemplatesAsync(
      string userId)
  {
    var templateIds =
      await RecurringBillTemplates
        .Find(template =>
          template.UserId == userId)
        .Project(template =>
          template.Id)
        .ToListAsync();

    long unlinkedBills = 0;

    if (templateIds.Count > 0)
    {
      var billFilter =
        Builders<Bill>.Filter.And(
          Builders<Bill>.Filter.Eq(
            bill => bill.UserId,
            userId),
          Builders<Bill>.Filter.In(
            bill =>
              bill.RecurringBillTemplateId,
            templateIds));

      var billUpdate =
        Builders<Bill>.Update
          .Unset(
            bill =>
              bill.RecurringBillTemplateId);

      var unlinkResult =
        await Bills.UpdateManyAsync(
          billFilter,
          billUpdate);

      unlinkedBills =
        unlinkResult.ModifiedCount;
    }

    var templateResult =
      await RecurringBillTemplates
        .DeleteManyAsync(
          template =>
            template.UserId == userId);

    return new DeleteBudgetGroupResponse
    {
      Group =
        "Recurring Bill Templates",

      DeletedRecurringTemplates =
        templateResult.DeletedCount,

      UnlinkedBills =
        unlinkedBills,

      DeletedCount =
        templateResult.DeletedCount
    };
  }

  /*===========================================================
    DeleteAllCategoriesAsync:
    => Deletes every budget category for the current user.
    => Existing expense records are preserved.
    ===========================================================*/
  public async Task<DeleteBudgetGroupResponse>
    DeleteAllCategoriesAsync(
      string userId)
  {
    var result =
      await BudgetCategories.DeleteManyAsync(
        category =>
          category.UserId == userId);

    return new DeleteBudgetGroupResponse
    {
      Group =
        "Budget Categories",

      DeletedCategories =
        result.DeletedCount,

      DeletedCount =
        result.DeletedCount
    };
  }

  /*===========================================================
    DeleteAllBudgetMonthsAsync:
    => Deletes every budget month.
    => Also deletes all month-owned records.
    => Accounts and recurring templates are preserved.
  ===========================================================*/
  public async Task<DeleteBudgetGroupResponse>
    DeleteAllBudgetMonthsAsync(
      string userId)
  {
    /*
      Delete dependent records before deleting months.
    */
    var incomeResult =
      await IncomeRecords.DeleteManyAsync(
        income =>
          income.UserId == userId);

    var expenseResult =
      await ExpenseRecords.DeleteManyAsync(
        expense =>
          expense.UserId == userId);

    var categoryResult =
      await BudgetCategories.DeleteManyAsync(
        category =>
          category.UserId == userId);

    /*
      Transfers are not owned by a budget month,
      so they are preserved.

      However, bills are owned by budget months.
      Any transfer links to those bills must be removed first.
    */
    var billIds =
      await Bills
        .Find(bill =>
          bill.UserId == userId)
        .Project(bill =>
          bill.Id)
        .ToListAsync();

    long unlinkedTransfers = 0;

    if (billIds.Count > 0)
    {
      var transferFilter =
        Builders<AccountTransfer>.Filter.And(
          Builders<AccountTransfer>.Filter.Eq(
            transfer => transfer.UserId,
            userId),
          Builders<AccountTransfer>.Filter.In(
            transfer => transfer.BillId,
            billIds));

      var transferUpdate =
        Builders<AccountTransfer>.Update
          .Unset(
            transfer =>
              transfer.BillId);

      var unlinkResult =
        await AccountTransfers.UpdateManyAsync(
          transferFilter,
          transferUpdate);

      unlinkedTransfers =
        unlinkResult.ModifiedCount;
    }

    var billResult =
      await Bills.DeleteManyAsync(
        bill =>
          bill.UserId == userId);

    var monthResult =
      await BudgetMonths.DeleteManyAsync(
        month =>
          month.UserId == userId);

    var deletedTotal =
      incomeResult.DeletedCount +
      expenseResult.DeletedCount +
      categoryResult.DeletedCount +
      billResult.DeletedCount +
      monthResult.DeletedCount;

    return new DeleteBudgetGroupResponse
    {
      Group =
        "Budget Months",

      DeletedIncomeRecords =
        incomeResult.DeletedCount,

      DeletedExpenseRecords =
        expenseResult.DeletedCount,

      DeletedCategories =
        categoryResult.DeletedCount,

      DeletedBills =
        billResult.DeletedCount,

      DeletedBudgetMonths =
        monthResult.DeletedCount,

      UnlinkedTransfers =
        unlinkedTransfers,

      DeletedCount =
        deletedTotal
    };
  }

  /*===========================================================
    DeleteAllAccountsAsync:
    => Deletes every account.
    => Refuses deletion while financial records reference them.
  ===========================================================*/
  public async Task<DeleteBudgetGroupResponse?>
    DeleteAllAccountsAsync(
      string userId)
  {
    var incomeCount =
      await IncomeRecords.CountDocumentsAsync(
        income =>
          income.UserId == userId);

    var expenseCount =
      await ExpenseRecords.CountDocumentsAsync(
        expense =>
          expense.UserId == userId);

    var transferCount =
      await AccountTransfers.CountDocumentsAsync(
        transfer =>
          transfer.UserId == userId);

    if (incomeCount > 0 ||
        expenseCount > 0 ||
        transferCount > 0)
    {
      return null;
    }

    /*
      Clear destination account references before deleting accounts.

      Bills and templates may still exist after account deletion.
    */
    var billUpdate =
      Builders<Bill>.Update
        .Unset(
          bill =>
            bill.DestinationAccountId);

    await Bills.UpdateManyAsync(
      bill =>
        bill.UserId == userId,
      billUpdate);

    var templateUpdate =
      Builders<RecurringBillTemplate>.Update
        .Unset(
          template =>
            template.DestinationAccountId);

    await RecurringBillTemplates.UpdateManyAsync(
      template =>
        template.UserId == userId,
      templateUpdate);

    var result =
      await FinancialAccounts.DeleteManyAsync(
        account =>
          account.UserId == userId);

    return new DeleteBudgetGroupResponse
    {
      Group =
        "Accounts",

      DeletedAccounts =
        result.DeletedCount,

      DeletedCount =
        result.DeletedCount
    };
  }

  /*===========================================================
    DeleteAllBudgetDataAsync:
    => Deletes all budget data for the current user.
    => Deletes records in dependency-safe order.
  ===========================================================*/
  public async Task<DeleteBudgetGroupResponse>
    DeleteAllBudgetDataAsync(
      string userId)
  {
    var transferResult =
      await AccountTransfers.DeleteManyAsync(
        transfer =>
          transfer.UserId == userId);

    var incomeResult =
      await IncomeRecords.DeleteManyAsync(
        income =>
          income.UserId == userId);

    var expenseResult =
      await ExpenseRecords.DeleteManyAsync(
        expense =>
          expense.UserId == userId);

    var billResult =
      await Bills.DeleteManyAsync(
        bill =>
          bill.UserId == userId);

    var templateResult =
      await RecurringBillTemplates
        .DeleteManyAsync(
          template =>
            template.UserId == userId);

    var categoryResult =
      await BudgetCategories.DeleteManyAsync(
        category =>
          category.UserId == userId);

    var monthResult =
      await BudgetMonths.DeleteManyAsync(
        month =>
          month.UserId == userId);

    var accountResult =
      await FinancialAccounts.DeleteManyAsync(
        account =>
          account.UserId == userId);

    var deletedTotal =
      transferResult.DeletedCount +
      incomeResult.DeletedCount +
      expenseResult.DeletedCount +
      billResult.DeletedCount +
      templateResult.DeletedCount +
      categoryResult.DeletedCount +
      monthResult.DeletedCount +
      accountResult.DeletedCount;

    return new DeleteBudgetGroupResponse
    {
      Group =
        "All Budget Data",

      DeletedTransfers =
        transferResult.DeletedCount,

      DeletedIncomeRecords =
        incomeResult.DeletedCount,

      DeletedExpenseRecords =
        expenseResult.DeletedCount,

      DeletedBills =
        billResult.DeletedCount,

      DeletedRecurringTemplates =
        templateResult.DeletedCount,

      DeletedCategories =
        categoryResult.DeletedCount,

      DeletedBudgetMonths =
        monthResult.DeletedCount,

      DeletedAccounts =
        accountResult.DeletedCount,

      DeletedCount =
        deletedTotal
    };
  }
}