using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TaskManager.Api.Features.Budget.Controllers;

[Authorize]
public abstract class BudgetControllerBase : ControllerBase
{
  /*===========================================================
    GetUserId:
    => Reads the logged-in user's ID from the JWT token.
    => Ensures users only access their own finance information.
  ===========================================================*/
  protected string? GetUserId()
  {
    return User.FindFirstValue(ClaimTypes.NameIdentifier)
      ?? User.FindFirstValue("id")
      ?? User.FindFirstValue("sub");
  }

  /*===========================================================
    IsValidCategoryType:
    => Checks whether the main budget category type is allowed.
    => Allowed values are Expense, Savings, and Debt.
  ===========================================================*/
  protected static bool IsValidCategoryType(string type)
  {
    var allowedTypes = new[]
    {
      "Expense",
      "Savings",
      "Debt"
    };

    return allowedTypes.Contains(
      type,
      StringComparer.OrdinalIgnoreCase);
  }

  /*===========================================================
    IsValidExpenseType:
    => Checks whether an expense classification is allowed.
    => Allowed values are Fixed and Variable.
  ===========================================================*/
  protected static bool IsValidExpenseType(string expenseType)
  {
    var allowedTypes = new[]
    {
      "Fixed",
      "Variable"
    };

    return allowedTypes.Contains(
      expenseType,
      StringComparer.OrdinalIgnoreCase);
  }

  /*===========================================================
    ValidateCategoryClassification:
    => Requires Fixed or Variable when the category is Expense.
    => Requires ExpenseType to be empty for Savings or Debt.
    => Returns an error message or null when valid.
  ===========================================================*/
  protected static string? ValidateCategoryClassification(
    string categoryType,
    string? expenseType)
  {
    if (categoryType.Equals(
      "Expense",
      StringComparison.OrdinalIgnoreCase))
    {
      if (string.IsNullOrWhiteSpace(expenseType))
      {
        return "Expense type is required for an Expense category.";
      }

      if (!IsValidExpenseType(expenseType))
      {
        return "Expense type must be Fixed or Variable.";
      }

      return null;
    }

    if (!string.IsNullOrWhiteSpace(expenseType))
    {
      return "Expense type must be empty for Savings and Debt categories.";
    }

    return null;
  }

  /*===========================================================
    IsValidAccountType:
    => Checks whether the financial account type is allowed.
    => Allowed values are Checking, Savings, and CreditCard.
  ===========================================================*/
  protected static bool IsValidAccountType(string type)
  {
    var allowedTypes = new[]
    {
      "Checking",
      "Savings",
      "CreditCard"
    };

    return allowedTypes.Contains(
      type,
      StringComparer.OrdinalIgnoreCase);
  }
}