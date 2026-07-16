using MongoDB.Bson;
using MongoDB.Driver;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

public class BudgetIndexService : BudgetBaseService
{
  /*===========================================================
    BudgetIndexService Constructor:
    => Receives the MongoDB database through dependency injection.
    => Passes the database to BudgetBaseService.
  ===========================================================*/
  public BudgetIndexService(
    IMongoDatabase database) : base(database)
  {
  }

  /*===========================================================
    ReplaceLegacyBudgetIndexesAsync:
    => Removes older indexes that use MongoDB's automatic names.
    => Removes the old recurring-bill index that indexed null values.
    => This migration only needs to run successfully one time.
  ===========================================================*/
  public async Task ReplaceLegacyBudgetIndexesAsync()
  {
    /*
      Old recurring bill index.

      This index must be removed because the old version included
      manually created bills where RecurringBillTemplateId was null.
    */
    await DropIndexIfExistsAsync(
      Bills,
      "UX_Bills_User_Month_Template");

    /*
      Older automatically named BudgetMonthId indexes.
    */
    await DropIndexIfExistsAsync(
      BudgetCategories,
      "UserId_1_BudgetMonthId_1");

    await DropIndexIfExistsAsync(
      IncomeRecords,
      "UserId_1_BudgetMonthId_1");

    await DropIndexIfExistsAsync(
      ExpenseRecords,
      "UserId_1_BudgetMonthId_1");

    /*
      Older automatically named AccountId indexes.
    */
    await DropIndexIfExistsAsync(
      IncomeRecords,
      "UserId_1_AccountId_1");

    await DropIndexIfExistsAsync(
      ExpenseRecords,
      "UserId_1_AccountId_1");

    /*
      Older automatically named financial account index.
    */
    await DropIndexIfExistsAsync(
      FinancialAccounts,
      "UserId_1_Name_1");

    /*
      Older automatically named account-transfer indexes.
    */
    await DropIndexIfExistsAsync(
      AccountTransfers,
      "UserId_1_TransferDate_-1");

    await DropIndexIfExistsAsync(
      AccountTransfers,
      "UserId_1_TransferDate_1");

    await DropIndexIfExistsAsync(
      AccountTransfers,
      "UserId_1_FromAccountId_1");

    await DropIndexIfExistsAsync(
      AccountTransfers,
      "UserId_1_ToAccountId_1");

    /*
      Older automatically named bill indexes.
    */
    await DropIndexIfExistsAsync(
      Bills,
      "UserId_1_BudgetMonthId_1_DueDate_1");

    /*
      Older automatically named recurring-template index.
    */
    await DropIndexIfExistsAsync(
      RecurringBillTemplates,
      "UserId_1_Name_1");

    Console.WriteLine(
      "Legacy budget index migration completed.");
  }

  /*===========================================================
    CreateIndexesAsync:
    => Creates indexes for the budget and finance collections.
    => Improves query and account-balance performance.
    => Enforces uniqueness where duplicate records are not allowed.
  ===========================================================*/
  public async Task CreateIndexesAsync()
  {
    await CreateBudgetMonthIndexesAsync();

    await CreateBudgetCategoryIndexesAsync();

    await CreateIncomeIndexesAsync();

    await CreateExpenseIndexesAsync();

    await CreateFinancialAccountIndexesAsync();

    await CreateAccountTransferIndexesAsync();

    await CreateBillIndexesAsync();

    await CreateRecurringBillTemplateIndexesAsync();
  }

  /*===========================================================
    CreateBudgetMonthIndexesAsync:
    => Prevents a user from creating the same month and year twice.
    => Different users may still create the same month and year.
  ===========================================================*/
  private async Task CreateBudgetMonthIndexesAsync()
  {
    var indexKeys = Builders<BudgetMonth>.IndexKeys
      .Ascending(b => b.UserId)
      .Ascending(b => b.Year)
      .Ascending(b => b.Month);

    var indexOptions = new CreateIndexOptions
    {
      Unique = true,
      Name = "UX_BudgetMonths_User_Year_Month"
    };

    await BudgetMonths.Indexes.CreateOneAsync(
      new CreateIndexModel<BudgetMonth>(
        indexKeys,
        indexOptions));
  }

  /*===========================================================
    CreateBudgetCategoryIndexesAsync:
    => Improves loading all categories for a budget month.
  ===========================================================*/
  private async Task CreateBudgetCategoryIndexesAsync()
  {
    var indexKeys = Builders<BudgetCategory>.IndexKeys
      .Ascending(c => c.UserId)
      .Ascending(c => c.BudgetMonthId);

    var indexOptions = new CreateIndexOptions
    {
      Name = "IX_BudgetCategories_User_BudgetMonth"
    };

    await BudgetCategories.Indexes.CreateOneAsync(
      new CreateIndexModel<BudgetCategory>(
        indexKeys,
        indexOptions));
  }

  /*===========================================================
    CreateIncomeIndexesAsync:
    => Improves monthly income queries.
    => Improves account-balance calculations for income.
  ===========================================================*/
  private async Task CreateIncomeIndexesAsync()
  {
    var budgetMonthIndexKeys =
      Builders<IncomeRecord>.IndexKeys
        .Ascending(i => i.UserId)
        .Ascending(i => i.BudgetMonthId);

    var budgetMonthIndexOptions =
      new CreateIndexOptions
      {
        Name = "IX_IncomeRecords_User_BudgetMonth"
      };

    await IncomeRecords.Indexes.CreateOneAsync(
      new CreateIndexModel<IncomeRecord>(
        budgetMonthIndexKeys,
        budgetMonthIndexOptions));

    var accountIndexKeys =
      Builders<IncomeRecord>.IndexKeys
        .Ascending(i => i.UserId)
        .Ascending(i => i.AccountId);

    var accountIndexOptions =
      new CreateIndexOptions
      {
        Name = "IX_IncomeRecords_User_Account"
      };

    await IncomeRecords.Indexes.CreateOneAsync(
      new CreateIndexModel<IncomeRecord>(
        accountIndexKeys,
        accountIndexOptions));
  }

  /*===========================================================
    CreateExpenseIndexesAsync:
    => Improves monthly expense queries.
    => Improves account-balance calculations for expenses.
  ===========================================================*/
  private async Task CreateExpenseIndexesAsync()
  {
    var budgetMonthIndexKeys =
      Builders<ExpenseRecord>.IndexKeys
        .Ascending(e => e.UserId)
        .Ascending(e => e.BudgetMonthId);

    var budgetMonthIndexOptions =
      new CreateIndexOptions
      {
        Name = "IX_ExpenseRecords_User_BudgetMonth"
      };

    await ExpenseRecords.Indexes.CreateOneAsync(
      new CreateIndexModel<ExpenseRecord>(
        budgetMonthIndexKeys,
        budgetMonthIndexOptions));

    var accountIndexKeys =
      Builders<ExpenseRecord>.IndexKeys
        .Ascending(e => e.UserId)
        .Ascending(e => e.AccountId);

    var accountIndexOptions =
      new CreateIndexOptions
      {
        Name = "IX_ExpenseRecords_User_Account"
      };

    await ExpenseRecords.Indexes.CreateOneAsync(
      new CreateIndexModel<ExpenseRecord>(
        accountIndexKeys,
        accountIndexOptions));
  }

  /*===========================================================
    CreateFinancialAccountIndexesAsync:
    => Improves loading and sorting the user's accounts by name.
  ===========================================================*/
  private async Task CreateFinancialAccountIndexesAsync()
  {
    var indexKeys =
      Builders<FinancialAccount>.IndexKeys
        .Ascending(a => a.UserId)
        .Ascending(a => a.Name);

    var indexOptions =
      new CreateIndexOptions
      {
        Name = "IX_FinancialAccounts_User_Name"
      };

    await FinancialAccounts.Indexes.CreateOneAsync(
      new CreateIndexModel<FinancialAccount>(
        indexKeys,
        indexOptions));
  }

  /*===========================================================
    CreateAccountTransferIndexesAsync:
    => Improves transfer history queries.
    => Improves transfers-in and transfers-out balance calculations.
  ===========================================================*/
  private async Task CreateAccountTransferIndexesAsync()
  {
    var dateIndexKeys =
      Builders<AccountTransfer>.IndexKeys
        .Ascending(t => t.UserId)
        .Descending(t => t.TransferDate);

    var dateIndexOptions =
      new CreateIndexOptions
      {
        Name = "IX_AccountTransfers_User_Date"
      };

    await AccountTransfers.Indexes.CreateOneAsync(
      new CreateIndexModel<AccountTransfer>(
        dateIndexKeys,
        dateIndexOptions));

    var fromAccountIndexKeys =
      Builders<AccountTransfer>.IndexKeys
        .Ascending(t => t.UserId)
        .Ascending(t => t.FromAccountId);

    var fromAccountIndexOptions =
      new CreateIndexOptions
      {
        Name = "IX_AccountTransfers_User_FromAccount"
      };

    await AccountTransfers.Indexes.CreateOneAsync(
      new CreateIndexModel<AccountTransfer>(
        fromAccountIndexKeys,
        fromAccountIndexOptions));

    var toAccountIndexKeys =
      Builders<AccountTransfer>.IndexKeys
        .Ascending(t => t.UserId)
        .Ascending(t => t.ToAccountId);

    var toAccountIndexOptions =
      new CreateIndexOptions
      {
        Name = "IX_AccountTransfers_User_ToAccount"
      };

    await AccountTransfers.Indexes.CreateOneAsync(
      new CreateIndexModel<AccountTransfer>(
        toAccountIndexKeys,
        toAccountIndexOptions));
  }

  /*===========================================================
    CreateBillIndexesAsync:
    => Improves bill calendar and monthly bill queries.
    => Prevents duplicate generated bills for the same template.
    => Excludes manually created bills from the unique index.
  ===========================================================*/
  private async Task CreateBillIndexesAsync()
  {
    var dueDateIndexKeys =
      Builders<Bill>.IndexKeys
        .Ascending(b => b.UserId)
        .Ascending(b => b.BudgetMonthId)
        .Ascending(b => b.DueDate);

    var dueDateIndexOptions =
      new CreateIndexOptions
      {
        Name = "IX_Bills_User_BudgetMonth_DueDate"
      };

    await Bills.Indexes.CreateOneAsync(
      new CreateIndexModel<Bill>(
        dueDateIndexKeys,
        dueDateIndexOptions));

    /*
      Only bills containing a real string RecurringBillTemplateId
      are included in this partial unique index.

      Manually created bills omit RecurringBillTemplateId because
      the Bill model uses [BsonIgnoreIfNull].
    */
    var recurringTemplateFilter =
      Builders<Bill>.Filter.Type(
        b => b.RecurringBillTemplateId,
        BsonType.String);

    var recurringTemplateIndexKeys =
      Builders<Bill>.IndexKeys
        .Ascending(b => b.UserId)
        .Ascending(b => b.BudgetMonthId)
        .Ascending(b => b.RecurringBillTemplateId);

    var recurringTemplateIndexOptions =
      new CreateIndexOptions<Bill>
      {
        Unique = true,
        Name = "UX_Bills_User_Month_Template",
        PartialFilterExpression = recurringTemplateFilter
      };

    await Bills.Indexes.CreateOneAsync(
      new CreateIndexModel<Bill>(
        recurringTemplateIndexKeys,
        recurringTemplateIndexOptions));
  }

  /*===========================================================
    CreateRecurringBillTemplateIndexesAsync:
    => Improves loading and sorting recurring templates.
  ===========================================================*/
  private async Task CreateRecurringBillTemplateIndexesAsync()
  {
    var indexKeys =
      Builders<RecurringBillTemplate>.IndexKeys
        .Ascending(t => t.UserId)
        .Ascending(t => t.Name);

    var indexOptions =
      new CreateIndexOptions
      {
        Name = "IX_RecurringBillTemplates_User_Name"
      };

    await RecurringBillTemplates.Indexes.CreateOneAsync(
      new CreateIndexModel<RecurringBillTemplate>(
        indexKeys,
        indexOptions));
  }

  /*===========================================================
    DropIndexIfExistsAsync:
    => Removes an index from a MongoDB collection.
    => Ignores the operation when the index does not exist.
    => Used only for the one-time legacy index migration.
  ===========================================================*/
  private static async Task DropIndexIfExistsAsync<TDocument>(
    IMongoCollection<TDocument> collection,
    string indexName)
  {
    try
    {
      await collection.Indexes.DropOneAsync(indexName);

      Console.WriteLine(
        $"Removed index '{indexName}' from " +
        $"'{collection.CollectionNamespace.CollectionName}'.");
    }
    catch (MongoCommandException ex)
      when (
        ex.CodeName == "IndexNotFound" ||
        ex.Code == 27)
    {
      Console.WriteLine(
        $"Index '{indexName}' was not found on " +
        $"'{collection.CollectionNamespace.CollectionName}'.");
    }
  }
}