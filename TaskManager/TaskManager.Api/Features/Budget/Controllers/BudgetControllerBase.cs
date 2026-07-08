using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TaskManager.Api.Features.Budget.Controllers;

// Requires the user to be logged in before using
// any controller that inherits from this base controller.
[Authorize]

// Abstract base controller shared by all Budget feature controllers.
// This class holds common helper methods so we do not repeat them
// in AccountsController, BudgetCategoriesController, BudgetAdminController, etc.
public abstract class BudgetControllerBase : ControllerBase
{
  // Reads the logged-in user's ID from the JWT token.
  protected string? GetUserId()
  {
    return User.FindFirstValue(ClaimTypes.NameIdentifier)
      ?? User.FindFirstValue("id")
      ?? User.FindFirstValue("sub");
  }

  // Checks if the budget category type is allowed.
  protected static bool IsValidCategoryType(string type)
  {
    // Allowed category types
    var allowedTypes = new[] { "Expense", "Savings", "Debt" };

    // Compare without caring about uppercase or lowercase letters
    return allowedTypes.Contains(type, StringComparer.OrdinalIgnoreCase);
  }

  // Checks if the financial account type is allowed.
  protected static bool IsValidAccountType(string type)
  {
    // Allowed account types
    var allowedTypes = new[] { "Checking", "Savings", "CreditCard" };

    // Compare without caring about uppercase or lowercase letters
    return allowedTypes.Contains(type, StringComparer.OrdinalIgnoreCase);
  }
}