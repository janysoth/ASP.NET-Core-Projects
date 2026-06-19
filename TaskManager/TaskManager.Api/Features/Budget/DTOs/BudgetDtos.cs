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
  public string Source { get; set; } = string.Empty;

  public decimal Amount { get; set; }

  public DateTime IncomeDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record UpdateIncomeRequest
{
  public string Source { get; set; } = string.Empty;

  public decimal Amount { get; set; }

  public DateTime IncomeDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record CreateExpenseRequest
{
  public string Category { get; set; } = string.Empty;

  public string Name { get; set; } = string.Empty;

  public decimal Amount { get; set; }

  public DateTime ExpenseDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record UpdateExpenseRequest
{
  public string Category { get; set; } = string.Empty;

  public string Name { get; set; } = string.Empty;

  public decimal Amount { get; set; }

  public DateTime ExpenseDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record IncomeResponse
{
  public string Id { get; set; } = string.Empty;

  public string BudgetMonthId { get; set; } = string.Empty;

  public string Source { get; set; } = string.Empty;

  public decimal Amount { get; set; }

  public DateTime IncomeDate { get; set; }

  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; }
}

public sealed record ExpenseResponse
{
  public string Id { get; set; } = string.Empty;

  public string BudgetMonthId { get; set; } = string.Empty;

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

  public decimal TotalIncome { get; set; }

  public decimal TotalExpenses { get; set; }

  public decimal RemainingBalance { get; set; }

  public decimal TotalPlannedExpenses { get; set; }

  public decimal RemainingPlannedExpenseBudget { get; set; }

  public IReadOnlyList<BudgetCategoryResponse> BudgetCategories { get; set; } = [];

  public IReadOnlyList<IncomeResponse> IncomeRecords { get; set; } = [];

  public IReadOnlyList<ExpenseResponse> ExpenseRecords { get; set; } = [];

  public DateTime CreatedAtUtc { get; set; }
}

public sealed record CreateBudgetCategoryRequest
{
  public string Name { get; set; } = string.Empty;

  public decimal PlannedAmount { get; set; }
}

public sealed record UpdateBudgetCategoryRequest
{
  public string Name { get; set; } = string.Empty;

  public decimal PlannedAmount { get; set; }
}

public class BudgetCategoryResponse
{
  public string? Id { get; set; }

  public string BudgetMonthId { get; set; } = string.Empty;

  public string Name { get; set; } = string.Empty;

  public decimal PlannedAmount { get; set; }

  public decimal SpentAmount { get; set; }

  public decimal RemainingAmount { get; set; }

  public DateTime CreatedAtUtc { get; set; }
}