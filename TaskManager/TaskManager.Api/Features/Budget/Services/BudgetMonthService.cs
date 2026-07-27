using MongoDB.Driver;
using TaskManager.Api.Features.Budget.Constants;
using TaskManager.Api.Features.Budget.Mappers;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Services;

public class BudgetMonthService : BudgetBaseService
{
  /*===========================================================
    BudgetMonthService Constructor
  ===========================================================*/
  public BudgetMonthService(IMongoDatabase database)
    : base(database)
  {
  }

  /*===========================================================
    GetBudgetMonthsAsync:
    => Gets all budget months owned by the current user.
    => Builds the complete budget response for each month.
  ===========================================================*/
  public async Task<List<BudgetMonthResponse>> GetBudgetMonthsAsync(
    string userId)
  {
    /*---------------------------------------------------------
      Get user's budget months from MongoDB.
    ---------------------------------------------------------*/
    var budgetMonths = await BudgetMonths
      .Find(budgetMonth =>
        budgetMonth.UserId == userId)
      .SortByDescending(budgetMonth =>
        budgetMonth.Year)
      .ThenByDescending(budgetMonth =>
        budgetMonth.Month)
      .ToListAsync();

    /*---------------------------------------------------------
      Build complete response objects.
    ---------------------------------------------------------*/
    var responses =
      new List<BudgetMonthResponse>();

    foreach (var budgetMonth in budgetMonths)
    {
      responses.Add(
        await BuildBudgetMonthResponseAsync(
          budgetMonth));
    }

    return responses;
  }

  /*===========================================================
    GetBudgetMonthByIdAsync:
    => Gets one budget month owned by the current user.
    => Returns the complete BudgetMonthResponse.
  ===========================================================*/
  public async Task<BudgetMonthResponse?> GetBudgetMonthByIdAsync(
    string id,
    string userId)
  {
    var budgetMonth = await BudgetMonths
      .Find(budgetMonth =>
        budgetMonth.Id == id &&
        budgetMonth.UserId == userId)
      .FirstOrDefaultAsync();

    if (budgetMonth is null)
    {
      return null;
    }

    return await BuildBudgetMonthResponseAsync(
      budgetMonth);
  }

  /*===========================================================
    CreateBudgetMonthAsync:
    => Creates a new budget month for the current user.
    => Prevents duplicate month/year combinations.
  ===========================================================*/
  public async Task<BudgetMonthResponse?> CreateBudgetMonthAsync(
    CreateBudgetMonthRequest request,
    string userId)
  {
    var existingBudgetMonth = await BudgetMonths
      .Find(budgetMonth =>
        budgetMonth.UserId == userId &&
        budgetMonth.Month == request.Month &&
        budgetMonth.Year == request.Year)
      .FirstOrDefaultAsync();

    if (existingBudgetMonth is not null)
    {
      return null;
    }

    var budgetMonth =
      new BudgetMonth
      {
        UserId =
          userId,

        Month =
          request.Month,

        Year =
          request.Year,

        PlannedIncome =
          request.PlannedIncome,

        CreatedAtUtc =
          DateTime.UtcNow
      };

    await BudgetMonths.InsertOneAsync(
      budgetMonth);

    return await BuildBudgetMonthResponseAsync(
      budgetMonth);
  }

  /*===========================================================
    UpdateBudgetMonthAsync:
    => Updates the planned income for one budget month.
    => Returns the updated complete response.
  ===========================================================*/
  public async Task<BudgetMonthResponse?> UpdateBudgetMonthAsync(
    string id,
    UpdateBudgetMonthRequest request,
    string userId)
  {
    var update =
      Builders<BudgetMonth>.Update
        .Set(
          budgetMonth =>
            budgetMonth.PlannedIncome,
          request.PlannedIncome);

    var result =
      await BudgetMonths.UpdateOneAsync(
        budgetMonth =>
          budgetMonth.Id == id &&
          budgetMonth.UserId == userId,
        update);

    if (result.MatchedCount == 0)
    {
      return null;
    }

    return await GetBudgetMonthByIdAsync(
      id,
      userId);
  }

  /*===========================================================
    DeleteBudgetMonthAsync:
    => Deletes one budget month owned by the current user.
    => Deletes related bills, categories, income, and expenses.
    => Returns the deleted budget month response.
  ===========================================================*/
  public async Task<BudgetMonthResponse?> DeleteBudgetMonthAsync(
    string id,
    string userId)
  {
    /*---------------------------------------------------------
      Find the budget month before deleting it.
    ---------------------------------------------------------*/
    var budgetMonth = await BudgetMonths
      .Find(existingBudgetMonth =>
        existingBudgetMonth.Id == id &&
        existingBudgetMonth.UserId == userId)
      .FirstOrDefaultAsync();

    if (budgetMonth is null)
    {
      return null;
    }

    /*---------------------------------------------------------
      Build the response before related records are removed.
    ---------------------------------------------------------*/
    var deletedBudgetMonth =
      await BuildBudgetMonthResponseAsync(
        budgetMonth);

    /*---------------------------------------------------------
      Load bills before deleting them.

      Transfer bills may have AccountTransfer records pointing
      to BillId.

      We keep those real account transfers as financial history,
      but remove the BillId before deleting the bill.
    ---------------------------------------------------------*/
    var monthBills = await Bills
      .Find(bill =>
        bill.BudgetMonthId == id &&
        bill.UserId == userId)
      .ToListAsync();

    var transferBillIds = monthBills
      .Where(bill =>
        string.Equals(
          bill.PaymentType,
          BillPaymentTypes.Transfer,
          StringComparison.OrdinalIgnoreCase))
      .Select(bill =>
        bill.Id)
      .ToList();

    if (transferBillIds.Count > 0)
    {
      var unlinkTransferUpdate =
        Builders<AccountTransfer>.Update
          .Unset(transfer =>
            transfer.BillId);

      await AccountTransfers.UpdateManyAsync(
        transfer =>
          transfer.UserId == userId &&
          transfer.BillId != null &&
          transferBillIds.Contains(
            transfer.BillId),
        unlinkTransferUpdate);
    }

    /*---------------------------------------------------------
      Delete related child records.
    ---------------------------------------------------------*/
    await Bills.DeleteManyAsync(
      bill =>
        bill.BudgetMonthId == id &&
        bill.UserId == userId);

    await BudgetCategories.DeleteManyAsync(
      category =>
        category.BudgetMonthId == id &&
        category.UserId == userId);

    await IncomeRecords.DeleteManyAsync(
      income =>
        income.BudgetMonthId == id &&
        income.UserId == userId);

    await ExpenseRecords.DeleteManyAsync(
      expense =>
        expense.BudgetMonthId == id &&
        expense.UserId == userId);

    /*---------------------------------------------------------
      Delete the parent budget month.
    ---------------------------------------------------------*/
    var deleteResult =
      await BudgetMonths.DeleteOneAsync(
        existingBudgetMonth =>
          existingBudgetMonth.Id == id &&
          existingBudgetMonth.UserId == userId);

    if (deleteResult.DeletedCount == 0)
    {
      return null;
    }

    return deletedBudgetMonth;
  }

  /*===========================================================
    BuildBudgetMonthResponseAsync:
    => Loads categories, bills, incomes, and expenses.
    => Calculates zero-based budgeting totals.
    => Separates Fixed and Variable expenses.
    => Matches expenses to categories using CategoryId.

    BUDGET RULES:

    Fixed Expense:
    => Planned budget comes automatically from
       linked Bill.ExpectedAmount.

    Variable Expense:
    => Planned budget comes from
       BudgetCategory.PlannedAmount.

    Savings:
    => Planned budget comes from
       BudgetCategory.PlannedAmount.

    Transfer Bill:
    => Does NOT count as another expense.
    => It represents money moving between accounts.
  ===========================================================*/
  private async Task<BudgetMonthResponse>
    BuildBudgetMonthResponseAsync(
      BudgetMonth budgetMonth)
  {
    /*---------------------------------------------------------
      Load all categories for this budget month.
    ---------------------------------------------------------*/
    var budgetCategories = await BudgetCategories
      .Find(category =>
        category.BudgetMonthId ==
          budgetMonth.Id &&
        category.UserId ==
          budgetMonth.UserId)
      .SortBy(category =>
        category.Name)
      .ToListAsync();

    /*---------------------------------------------------------
      Load all income records for this budget month.
    ---------------------------------------------------------*/
    var incomeRecords = await IncomeRecords
      .Find(income =>
        income.BudgetMonthId ==
          budgetMonth.Id &&
        income.UserId ==
          budgetMonth.UserId)
      .SortByDescending(income =>
        income.IncomeDate)
      .ToListAsync();

    /*---------------------------------------------------------
      Load all expense records for this budget month.
    ---------------------------------------------------------*/
    var expenseRecords = await ExpenseRecords
      .Find(expense =>
        expense.BudgetMonthId ==
          budgetMonth.Id &&
        expense.UserId ==
          budgetMonth.UserId)
      .SortByDescending(expense =>
        expense.ExpenseDate)
      .ToListAsync();

    /*---------------------------------------------------------
      Load Expense bills for this budget month.

      These are the bills that represent real budget expenses.

      Examples:

      Mortgage
      Internet
      Phone
      Insurance
      Utilities

      Transfer bills are intentionally excluded.

      Example Transfer bill:

      Checking
      →
      Credit Card

      A credit-card payment is not a new expense.
    ---------------------------------------------------------*/
    var expenseBills = await Bills
      .Find(bill =>
        bill.BudgetMonthId ==
          budgetMonth.Id &&
        bill.UserId ==
          budgetMonth.UserId &&
        bill.PaymentType ==
          BillPaymentTypes.Expense)
      .ToListAsync();

    /*---------------------------------------------------------
      Calculate actual income and expense totals.
    ---------------------------------------------------------*/
    var totalIncome =
      incomeRecords.Sum(income =>
        income.Amount);

    var totalExpenses =
      expenseRecords.Sum(expense =>
        expense.Amount);

    /*---------------------------------------------------------
      Get only Expense categories.

      Savings categories are not regular spending categories.
    ---------------------------------------------------------*/
    var expenseCategories = budgetCategories
      .Where(category =>
        string.Equals(
          category.Type,
          BudgetCategoryTypes.Expense,
          StringComparison.OrdinalIgnoreCase))
      .ToList();

    /*---------------------------------------------------------
      Separate Expense categories into Fixed and Variable.
    ---------------------------------------------------------*/
    var fixedCategories = expenseCategories
      .Where(category =>
        string.Equals(
          category.ExpenseType,
          ExpenseTypes.Fixed,
          StringComparison.OrdinalIgnoreCase))
      .ToList();

    var variableCategories = expenseCategories
      .Where(category =>
        string.Equals(
          category.ExpenseType,
          ExpenseTypes.Variable,
          StringComparison.OrdinalIgnoreCase))
      .ToList();

    /*---------------------------------------------------------
      Create sets of category IDs.

      Using CategoryId means category renames do not break
      expense or bill relationships.
    ---------------------------------------------------------*/
    var fixedCategoryIds = fixedCategories
      .Select(category =>
        category.Id)
      .ToHashSet();

    var variableCategoryIds = variableCategories
      .Select(category =>
        category.Id)
      .ToHashSet();

    /*---------------------------------------------------------
      Calculate PLANNED FIXED expenses.

      IMPORTANT CHANGE:

      OLD:
      => FixedCategory.PlannedAmount

      NEW:
      => Sum of Bill.ExpectedAmount for bills connected to
         Fixed Expense categories.

      Example:

      Mortgage bill = $1,600
      Internet bill = $80
      Phone bill = $120

      TotalPlannedFixedExpenses = $1,800
    ---------------------------------------------------------*/
    var totalPlannedFixedExpenses = expenseBills
      .Where(bill =>
        !string.IsNullOrWhiteSpace(
          bill.BudgetCategoryId) &&
        fixedCategoryIds.Contains(
          bill.BudgetCategoryId))
      .Sum(bill =>
        bill.ExpectedAmount);

    /*---------------------------------------------------------
      Calculate PLANNED VARIABLE expenses.

      Variable categories continue using their manually
      assigned PlannedAmount.

      Example:

      Groceries = $500
      Dining    = $200
      Shopping  = $300

      TotalPlannedVariableExpenses = $1,000
    ---------------------------------------------------------*/
    var totalPlannedVariableExpenses =
      variableCategories.Sum(category =>
        category.PlannedAmount);

    /*---------------------------------------------------------
      Total planned expenses:

      Fixed Bills
      +
      Variable Budgets
    ---------------------------------------------------------*/
    var totalPlannedExpenses =
      totalPlannedFixedExpenses +
      totalPlannedVariableExpenses;

    /*---------------------------------------------------------
      Calculate ACTUAL Fixed expenses.

      An expense is Fixed when its CategoryId points to a
      Fixed Expense category.
    ---------------------------------------------------------*/
    var totalFixedExpenses = expenseRecords
      .Where(expense =>
        fixedCategoryIds.Contains(
          expense.CategoryId))
      .Sum(expense =>
        expense.Amount);

    /*---------------------------------------------------------
      Calculate ACTUAL Variable expenses.

      An expense is Variable when its CategoryId points to a
      Variable Expense category.
    ---------------------------------------------------------*/
    var totalVariableExpenses = expenseRecords
      .Where(expense =>
        variableCategoryIds.Contains(
          expense.CategoryId))
      .Sum(expense =>
        expense.Amount);

    /*---------------------------------------------------------
      Calculate planned Savings.

      Savings continue using BudgetCategory.PlannedAmount.
    ---------------------------------------------------------*/
    var totalPlannedSavings = budgetCategories
      .Where(category =>
        string.Equals(
          category.Type,
          BudgetCategoryTypes.Savings,
          StringComparison.OrdinalIgnoreCase))
      .Sum(category =>
        category.PlannedAmount);

    /*---------------------------------------------------------
      Calculate total assigned for zero-based budgeting.

      We only have:

      Expenses
      +
      Savings

      Credit-card payments are AccountTransfers and are NOT
      assigned again here.
    ---------------------------------------------------------*/
    var totalAssigned =
      totalPlannedExpenses +
      totalPlannedSavings;

    /*---------------------------------------------------------
      Build category responses.

      We now provide expenseBills to the mapper.

      This lets a Fixed category calculate:

      BillPlannedAmount
      TotalPlannedAmount
      RemainingAmount
    ---------------------------------------------------------*/
    var categoryResponses = budgetCategories
      .Select(category =>
        BudgetCategoryMapper.ToResponse(
          category,
          expenseRecords,
          expenseBills))
      .ToList();

    /*---------------------------------------------------------
      Load accounts once for IncomeResponse account data.

      This avoids repeatedly querying MongoDB for each income.
    ---------------------------------------------------------*/
    var accounts = await FinancialAccounts
      .Find(account =>
        account.UserId ==
          budgetMonth.UserId)
      .ToListAsync();

    var accountLookup =
      accounts.ToDictionary(
        account =>
          account.Id,
        account =>
          account);

    /*---------------------------------------------------------
      Build income responses.
    ---------------------------------------------------------*/
    var incomeResponses = incomeRecords
      .Select(income =>
      {
        accountLookup.TryGetValue(
          income.AccountId,
          out var account);

        return IncomeMapper.ToResponse(
          income,
          account);
      })
      .ToList();

    /*---------------------------------------------------------
      Create a category-name lookup.

      ExpenseResponse returns:

      CategoryId
      CategoryName

      ExpenseRecord stores only CategoryId.
    ---------------------------------------------------------*/
    var categoryNameLookup =
      budgetCategories.ToDictionary(
        category =>
          category.Id,
        category =>
          category.Name);

    /*---------------------------------------------------------
      Build expense responses.
    ---------------------------------------------------------*/
    var expenseResponses = expenseRecords
      .Select(expense =>
      {
        var categoryName =
          categoryNameLookup.GetValueOrDefault(
            expense.CategoryId,
            "Unknown Category");

        return ExpenseMapper.ToResponse(
          expense,
          categoryName);
      })
      .ToList();

    /*---------------------------------------------------------
      Build the complete BudgetMonthResponse.
    ---------------------------------------------------------*/
    return new BudgetMonthResponse
    {
      Id =
        budgetMonth.Id,

      Month =
        budgetMonth.Month,

      Year =
        budgetMonth.Year,

      PlannedIncome =
        budgetMonth.PlannedIncome,

      /*=======================================================
        ACTUAL TOTALS
      =======================================================*/
      TotalIncome =
        totalIncome,

      TotalExpenses =
        totalExpenses,

      RemainingBalance =
        totalIncome -
        totalExpenses,

      /*=======================================================
        PLANNED EXPENSES
      =======================================================*/
      TotalPlannedExpenses =
        totalPlannedExpenses,

      TotalPlannedFixedExpenses =
        totalPlannedFixedExpenses,

      TotalPlannedVariableExpenses =
        totalPlannedVariableExpenses,

      /*=======================================================
        ACTUAL FIXED / VARIABLE EXPENSES
      =======================================================*/
      TotalFixedExpenses =
        totalFixedExpenses,

      TotalVariableExpenses =
        totalVariableExpenses,

      /*=======================================================
        REMAINING EXPENSE BUDGETS
      =======================================================*/
      RemainingFixedExpenseBudget =
        totalPlannedFixedExpenses -
        totalFixedExpenses,

      RemainingVariableExpenseBudget =
        totalPlannedVariableExpenses -
        totalVariableExpenses,

      RemainingPlannedExpenseBudget =
        totalPlannedExpenses -
        totalExpenses,

      /*=======================================================
        SAVINGS
      =======================================================*/
      TotalPlannedSavings =
        totalPlannedSavings,

      /*=======================================================
        ZERO-BASED BUDGET
      =======================================================*/
      TotalAssigned =
        totalAssigned,

      LeftToAssign =
        budgetMonth.PlannedIncome -
        totalAssigned,

      /*=======================================================
        DETAILS
      =======================================================*/
      BudgetCategories =
        categoryResponses,

      IncomeRecords =
        incomeResponses,

      ExpenseRecords =
        expenseResponses,

      CreatedAtUtc =
        budgetMonth.CreatedAtUtc
    };
  }
}