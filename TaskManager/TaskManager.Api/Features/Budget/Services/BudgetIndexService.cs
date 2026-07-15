using MongoDB.Driver;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

// Service responsible for creating MongoDB indexes.
// Indexes improve query performance and help enforce
// data integrity for the Budget feature.
public class BudgetIndexService : BudgetBaseService
{
  // Constructor used for Dependency Injection (DI)
  public BudgetIndexService(IMongoDatabase database) : base(database)
  {
  }

  // Creates all MongoDB indexes used by the Budget feature.
  // This method is typically called once when the application starts.
  public async Task CreateIndexesAsync()
  {
    // Create a unique index on UserId, Year, and Month.
    // Prevents a user from creating duplicate budget months
    // for the same month and year.
    await BudgetMonths.Indexes.CreateOneAsync(
      new CreateIndexModel<BudgetMonth>(
        Builders<BudgetMonth>.IndexKeys
          .Ascending(b => b.UserId)
          .Ascending(b => b.Year)
          .Ascending(b => b.Month),
        new CreateIndexOptions
        {
          Unique = true,
          Name = "UX_BudgetMonths_User_Year_Month"
        }));

    // Create an index to quickly find budget categories
    // for a specific user and budget month.
    await BudgetCategories.Indexes.CreateOneAsync(
      new CreateIndexModel<BudgetCategory>(
        Builders<BudgetCategory>.IndexKeys
          .Ascending(c => c.UserId)
          .Ascending(c => c.BudgetMonthId)));

    // Create an index to quickly find income records
    // for a specific user and budget month.
    await IncomeRecords.Indexes.CreateOneAsync(
      new CreateIndexModel<IncomeRecord>(
        Builders<IncomeRecord>.IndexKeys
          .Ascending(i => i.UserId)
          .Ascending(i => i.BudgetMonthId)));

    // Create an index to quickly find expense records
    // for a specific user and budget month.
    await ExpenseRecords.Indexes.CreateOneAsync(
      new CreateIndexModel<ExpenseRecord>(
        Builders<ExpenseRecord>.IndexKeys
          .Ascending(e => e.UserId)
          .Ascending(e => e.BudgetMonthId)));

    // Create an index to quickly find financial accounts
    // by user and account name.
    await FinancialAccounts.Indexes.CreateOneAsync(
      new CreateIndexModel<FinancialAccount>(
        Builders<FinancialAccount>.IndexKeys
          .Ascending(a => a.UserId)
          .Ascending(a => a.Name)));

    // Create an index to quickly find transfers
    // for a specific user ordered by transfer date.
    await AccountTransfers.Indexes.CreateOneAsync(
      new CreateIndexModel<AccountTransfer>(
        Builders<AccountTransfer>.IndexKeys
          .Ascending(t => t.UserId)
          .Ascending(t => t.TransferDate)));

    await Bills.Indexes.CreateOneAsync(
      new CreateIndexModel<Bill>(
        Builders<Bill>.IndexKeys
          .Ascending(b => b.UserId)
          .Ascending(b => b.BudgetMonthId)
          .Ascending(b => b.DueDate),
        new CreateIndexOptions
        {
          Name = "IX_Bills_User_BudgetMonth_DueDate"
        }));

    await RecurringBillTemplates.Indexes.CreateOneAsync(
      new CreateIndexModel<RecurringBillTemplate>(
        Builders<RecurringBillTemplate>.IndexKeys
          .Ascending(t => t.UserId)
          .Ascending(t => t.Name),
        new CreateIndexOptions
        {
          Name = "IX_RecurringBillTemplates_User_Name"
        }));

    await Bills.Indexes.CreateOneAsync(
      new CreateIndexModel<Bill>(
        Builders<Bill>.IndexKeys
          .Ascending(b => b.UserId)
          .Ascending(b => b.BudgetMonthId)
          .Ascending(b => b.RecurringBillTemplateId),
        new CreateIndexOptions
        {
          Unique = true,
          Sparse = true,
          Name = "UX_Bills_User_Month_Template"
        }));
  }
}