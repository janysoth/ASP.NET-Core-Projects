using System;
using System.Collections.Generic;
using Microsoft.VisualBasic;

namespace TaskManager.Api.Features.Budget.DTOs;

public sealed record CreateBudgetMonthRequest
{
  public int Month { get; set; }

  public int Year { get; set; }

  public decimal PlannedIncome { get; set; }
}

public sealed record UpdateBudgetMonthRequest
{
  public decimal PlannedIncome { get; set; }
}

public sealed record CreateIncomeRequest
{
  public string AccountId { get; set; } = string.Empty;

  public string Source { get; set; } = string.Empty;

  public decimal Amount { get; set; }

  public DateTime IncomeDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record UpdateIncomeRequest
{
  public string AccountId { get; set; } = string.Empty;

  public string Source { get; set; } = string.Empty;

  public decimal Amount { get; set; }

  public DateTime IncomeDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record IncomeResponse
{
  public string Id { get; set; } = string.Empty;

  public string BudgetMonthId { get; set; } = string.Empty;

  public string AccountId { get; set; } = string.Empty;

  public string AccountName { get; set; } = string.Empty;

  public string Source { get; set; } = string.Empty;

  public decimal Amount { get; set; }

  public DateTime IncomeDate { get; set; }

  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; }
}

public sealed record CreateExpenseRequest
{
  public string AccountId { get; set; } = string.Empty;

  public string Category { get; set; } = string.Empty;

  public string Name { get; set; } = string.Empty;

  public decimal Amount { get; set; }

  public DateTime ExpenseDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record UpdateExpenseRequest
{
  public string AccountId { get; set; } = string.Empty;

  public string Category { get; set; } = string.Empty;

  public string Name { get; set; } = string.Empty;

  public decimal Amount { get; set; }

  public DateTime ExpenseDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record ExpenseResponse
{
  public string Id { get; set; } = string.Empty;

  public string BudgetMonthId { get; set; } = string.Empty;

  public string AccountId { get; set; } = string.Empty;

  public string AccountName { get; set; } = string.Empty;

  public string Category { get; set; } = string.Empty;

  public string Name { get; set; } = string.Empty;

  public decimal Amount { get; set; }

  public DateTime ExpenseDate { get; set; }

  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; }
}

public sealed record BudgetMonthResponse
{
  public string Id { get; set; } = string.Empty;

  public int Month { get; set; }

  public int Year { get; set; }

  public decimal PlannedIncome { get; set; }

  // Actual money that came in

  public decimal TotalIncome { get; set; }

  // Actual money spent

  public decimal TotalExpenses { get; set; }

  // Actual income minus actual expenses

  public decimal RemainingBalance { get; set; }

  // Planned expense categories only
  public decimal TotalPlannedExpenses { get; set; }

  // Planned savings categories only
  public decimal TotalPlannedSavings { get; set; }

  // Planned debt categories only
  public decimal TotalPlannedDebt { get; set; }

  // Expense + Savings + Debt planned amounts
  public decimal TotalAssigned { get; set; }

  // Zero-based budget number
  public decimal LeftToAssign { get; set; }

  // Expense budget left after actual spending
  public decimal RemainingPlannedExpenseBudget { get; set; }

  public IReadOnlyList<BudgetCategoryResponse> BudgetCategories { get; set; } = [];

  public IReadOnlyList<IncomeResponse> IncomeRecords { get; set; } = [];

  public IReadOnlyList<ExpenseResponse> ExpenseRecords { get; set; } = [];

  public DateTime CreatedAtUtc { get; set; }
}

public sealed record CreateBudgetCategoryRequest
{
  public string Name { get; set; } = string.Empty;

  public string Type { get; set; } = "Expense";

  public decimal PlannedAmount { get; set; }
}

public sealed record UpdateBudgetCategoryRequest
{
  public string Name { get; set; } = string.Empty;

  public string Type { get; set; } = "Expense";

  public decimal PlannedAmount { get; set; }
}

public class BudgetCategoryResponse
{
  public string? Id { get; set; }

  public string BudgetMonthId { get; set; } = string.Empty;

  public string Name { get; set; } = string.Empty;

  public string Type { get; set; } = string.Empty;

  public decimal PlannedAmount { get; set; }

  public decimal SpentAmount { get; set; }

  public decimal RemainingAmount { get; set; }

  public DateTime CreatedAtUtc { get; set; }
}

public sealed record CreateFinancialAccountRequest
{
  public string Name { get; set; } = string.Empty;

  public string Type { get; set; } = "Checking";

  public decimal StartingBalance { get; set; }
}

public sealed record UpdateFinancialAccountRequest
{
  public string Name { get; set; } = string.Empty;

  public string Type { get; set; } = "Checking";

  public decimal StartingBalance { get; set; }
}

public sealed record FinancialAccountResponse
{
  public string Id { get; set; } = string.Empty;

  public string Name { get; set; } = string.Empty;

  public string Type { get; set; } = string.Empty;

  public decimal StartingBalance { get; set; }

  public decimal CurrentBalance { get; set; }

  public DateTime CreatedAtUtc { get; set; }
}

public sealed record CreateAccountTransferRequest
{
  public string FromAccountId { get; set; } = string.Empty;

  public string ToAccountId { get; set; } = string.Empty;

  public decimal Amount { get; set; }

  public DateTime TransferDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record AccountTransferResponse
{
  public string Id { get; set; } = string.Empty;

  public string FromAccountId { get; set; } = string.Empty;

  public string FromAccountName { get; set; } = string.Empty;

  public string ToAccountId { get; set; } = string.Empty;

  public string ToAccountName { get; set; } = string.Empty;

  public decimal Amount { get; set; }

  public DateTime TransferDate { get; set; }

  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; }
}

public sealed record PatchIncomeRequest
{
  public string? AccountId { get; set; }

  public string? Source { get; set; }

  public decimal? Amount { get; set; }

  public DateTime? IncomeDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record PatchExpenseRequest
{
  public string? AccountId { get; set; }

  public string? Category { get; set; }

  public string? Name { get; set; }

  public decimal? Amount { get; set; }

  public DateTime? ExpenseDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record PatchAccountTransferRequest
{
  public string? FromAccountId { get; set; }

  public string? ToAccountId { get; set; }

  public decimal? Amount { get; set; }

  public DateTime? TransferDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record CleanSlateResponse

{
  public long DeletedAccounts { get; set; }

  public long DeletedTransfers { get; set; }

  public long DeletedBudgetMonths { get; set; }

  public long DeletedBudgetCategories { get; set; }

  public long DeletedIncomeRecords { get; set; }

  public long DeletedExpenseRecords { get; set; }
}

public sealed record DeleteAllBudgetDataRequest

{
  public string Confirmation { get; set; } = string.Empty;
}


public sealed record DashboardSummaryResponse
{
  public decimal TotalCash { get; set; }

  public decimal TotalCreditCardDebt { get; set; }

  public decimal NetWorth { get; set; }

  public decimal CurrentMonthPlannedIncome { get; set; }

  public decimal CurrentMonthTotalIncome { get; set; }

  public decimal CurrentMonthTotalExpenses { get; set; }

  public decimal CurrentMonthLeftToAssign { get; set; }

  public decimal CurrentMonthRemainingExpenseBudget { get; set; }
}

