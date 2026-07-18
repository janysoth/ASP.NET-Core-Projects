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
    => Checks whether the category type is supported.
    => Allowed values are Expense and Savings.
  ===========================================================*/
  protected static bool IsValidCategoryType(string? type)
  {
    return BudgetCategoryTypes.IsValid(type);
  }

  /*===========================================================
    IsValidExpenseType:
    => Checks whether the expense classification is supported.
    => Allowed values are Fixed and Variable.
  ===========================================================*/
  protected static bool IsValidExpenseType(string? expenseType)
  {
    return ExpenseTypes.IsValid(expenseType);
  }

  /*===========================================================
    ValidateCategoryClassification:
    => Requires Fixed or Variable for Expense categories.
    => Requires ExpenseType to be empty for Savings categories.
    => Returns an error message or null when valid.
  ===========================================================*/
  protected static string? ValidateCategoryClassification(
    string categoryType,
    string? expenseType)
  {
    if (string.Equals(
      categoryType,
      BudgetCategoryTypes.Expense,
      StringComparison.OrdinalIgnoreCase))
    {
      if (string.IsNullOrWhiteSpace(expenseType))
      {
        return
          "Expense type is required for an Expense category.";
      }

      if (!ExpenseTypes.IsValid(expenseType))
      {
        return
          "Expense type must be Fixed or Variable.";
      }

      return null;
    }

    if (!string.IsNullOrWhiteSpace(expenseType))
    {
      return
        "Expense type must be empty for Savings categories.";
    }

    return null;
  }

  /*===========================================================
    IsValidAccountType:
    => Checks whether the account type is supported.
    => Allowed values are Checking, Savings, and CreditCard.
  ===========================================================*/
  protected static bool IsValidAccountType(string? type)
  {
    return FinancialAccountTypes.IsValid(type);
  }
}