using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

// Marks this class as an API controller.
// Enables automatic model binding and validation.
[ApiController]

// Base route for all budget administration endpoints.
// Example:
// POST /api/budget/admin/delete-all
[Route("api/budget/admin")]
public class BudgetAdminController : BudgetControllerBase
{
  // Service responsible for budget administration tasks
  private readonly BudgetAdminService _budgetAdminService;

  // Constructor used for Dependency Injection (DI)
  public BudgetAdminController(BudgetAdminService budgetAdminService)
  {
    _budgetAdminService = budgetAdminService;
  }

  // ==========================================
  // POST: api/budget/admin/delete-all
  // Deletes ALL budget-related data that belongs
  // to the currently logged-in user.
  //
  // This is a destructive operation and requires
  // a confirmation message before continuing.
  // ==========================================
  [HttpPost("delete-all")]
  public async Task<ActionResult<CleanSlateResponse>> DeleteAllBudgetData(
    [FromBody] DeleteAllBudgetDataRequest? request)
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Ensure a confirmation request was provided.
    // This helps prevent accidental deletion.
    if (request == null || string.IsNullOrWhiteSpace(request.Confirmation))
    {
      return BadRequest(
        "Please confirm this action by sending { \"confirmation\": \"DELETE ALL\" }.");
    }

    // Require the exact confirmation text before
    // allowing all budget data to be deleted.
    if (request.Confirmation != "DELETE ALL")
    {
      return BadRequest("Confirmation text must be exactly DELETE ALL.");
    }

    // Delete all budget-related data for this user
    var result = await _budgetAdminService.DeleteAllBudgetDataAsync(userId);

    // Return a summary of what was deleted
    return Ok(result);
  }
}