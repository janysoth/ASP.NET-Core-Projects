using MongoDB.Driver;
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
    => Bills, accounts, months, categories, and recurring
       templates are preserved.
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
    => Deletes every AccountTransfer for the current user.
    => Bills are not affected because transfers and bills
       are no longer connected.
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
    => Deletes every ExpenseRecord for the current user.
    => Bills themselves are preserved.

    IMPORTANT:
    => A paid bill may still contain ExpenseRecordId after
       this bulk admin operation.

    => This endpoint is intended as an administrative reset
       operation rather than normal user bill management.
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
    => AccountTransfers are preserved.
    => Recurring bill templates are preserved.

    IMPORTANT:
    => Bills and AccountTransfers are independent.
    => No transfer unlinking is required.
  ===========================================================*/
  public async Task<DeleteBudgetGroupResponse>
    DeleteAllBillsAsync(
      string userId)
  {
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

      DeletedCount =
        billResult.DeletedCount
    };
  }

  /*===========================================================
    DeleteAllRecurringTemplatesAsync:
    => Deletes recurring bill templates.
    => Preserves previously-generated bills.
    => Removes RecurringBillTemplateId from generated bills
       before deleting the templates.
  ===========================================================*/
  public async Task<DeleteBudgetGroupResponse>
    DeleteAllRecurringTemplatesAsync(
      string userId)
  {
    /*
      Get IDs of templates that will be deleted.
    */
    var templateIds =
      await RecurringBillTemplates
        .Find(template =>
          template.UserId == userId)
        .Project(template =>
          template.Id)
        .ToListAsync();

    long unlinkedBills = 0;

    /*
      Generated bills should remain valid even after their
      template is deleted.

      Remove the template reference first.
    */
    if (templateIds.Count > 0)
    {
      var billFilter =
        Builders<Bill>.Filter.And(
          Builders<Bill>.Filter.Eq(
            bill =>
              bill.UserId,
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

    IMPORTANT:
    => Bills depend on BudgetCategoryId.

    => Therefore, categories should not be bulk-deleted while
       bills still exist.

    => Expense records also use CategoryId. For a completely
       clean reset, use DeleteAllBudgetDataAsync instead.
  ===========================================================*/
  public async Task<DeleteBudgetGroupResponse?>
    DeleteAllCategoriesAsync(
      string userId)
  {
    /*
      Prevent orphaned Bill.BudgetCategoryId values.
    */
    var billCount =
      await Bills.CountDocumentsAsync(
        bill =>
          bill.UserId == userId);

    if (billCount > 0)
    {
      return null;
    }

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
    => Also deletes records owned by those budget months.

    Deletes:
    => IncomeRecords
    => ExpenseRecords
    => Bills
    => BudgetCategories
    => BudgetMonths

    Preserves:
    => FinancialAccounts
    => AccountTransfers
    => RecurringBillTemplates

    IMPORTANT:
    => AccountTransfers are independent from budget months.
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

    var billResult =
      await Bills.DeleteManyAsync(
        bill =>
          bill.UserId == userId);

    var categoryResult =
      await BudgetCategories.DeleteManyAsync(
        category =>
          category.UserId == userId);

    var monthResult =
      await BudgetMonths.DeleteManyAsync(
        month =>
          month.UserId == userId);

    var deletedTotal =
      incomeResult.DeletedCount +
      expenseResult.DeletedCount +
      billResult.DeletedCount +
      categoryResult.DeletedCount +
      monthResult.DeletedCount;

    return new DeleteBudgetGroupResponse
    {
      Group =
        "Budget Months",

      DeletedIncomeRecords =
        incomeResult.DeletedCount,

      DeletedExpenseRecords =
        expenseResult.DeletedCount,

      DeletedBills =
        billResult.DeletedCount,

      DeletedCategories =
        categoryResult.DeletedCount,

      DeletedBudgetMonths =
        monthResult.DeletedCount,

      DeletedCount =
        deletedTotal
    };
  }

  /*===========================================================
    DeleteAllAccountsAsync:
    => Deletes every financial account.
    => Refuses deletion while financial activity still
       references those accounts.

    Account references exist in:

    IncomeRecord.AccountId
    ExpenseRecord.AccountId
    AccountTransfer.FromAccountId
    AccountTransfer.ToAccountId

    Bills and recurring bill templates no longer store
    financial account IDs.
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

    /*
      Do not delete accounts while financial records still
      reference them.
    */
    if (incomeCount > 0 ||
        expenseCount > 0 ||
        transferCount > 0)
    {
      return null;
    }

    /*
      Bills and recurring templates no longer contain
      DestinationAccountId, so no cleanup is needed.
    */
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

    This is the complete clean-slate operation.
  ===========================================================*/
  public async Task<DeleteBudgetGroupResponse>
    DeleteAllBudgetDataAsync(
      string userId)
  {
    /*---------------------------------------------------------
      Delete financial activity first.
    ---------------------------------------------------------*/
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

    /*---------------------------------------------------------
      Delete bills and recurring templates.
    ---------------------------------------------------------*/
    var billResult =
      await Bills.DeleteManyAsync(
        bill =>
          bill.UserId == userId);

    var templateResult =
      await RecurringBillTemplates
        .DeleteManyAsync(
          template =>
            template.UserId == userId);

    /*---------------------------------------------------------
      Delete budget categories and months.
    ---------------------------------------------------------*/
    var categoryResult =
      await BudgetCategories.DeleteManyAsync(
        category =>
          category.UserId == userId);

    var monthResult =
      await BudgetMonths.DeleteManyAsync(
        month =>
          month.UserId == userId);

    /*---------------------------------------------------------
      Accounts can now safely be deleted because all financial
      records that reference them have already been removed.
    ---------------------------------------------------------*/
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