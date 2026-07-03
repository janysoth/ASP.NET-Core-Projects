using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TaskManager.Api.Features.Budget.Controllers;

[Authorize]
public abstract class BudgetControllerBase : ControllerBase
{
  protected string? GetUserId()
  {
    return User.FindFirstValue(ClaimTypes.NameIdentifier)
      ?? User.FindFirstValue("id")
      ?? User.FindFirstValue("sub");
  }

  protected static bool IsValidCategoryType(string type)
  {
    var allowedTypes = new[] { "Expense", "Savings", "Debt" };

    return allowedTypes.Contains(type, StringComparer.OrdinalIgnoreCase);
  }

  protected static bool IsValidAccountType(string type)
  {
    var allowedTypes = new[] { "Checking", "Savings", "CreditCard" };

    return allowedTypes.Contains(type, StringComparer.OrdinalIgnoreCase);
  }
}