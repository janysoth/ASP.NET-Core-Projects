using Microsoft.AspNetCore.Mvc;
// using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

// Marks this class as an API controller.
[ApiController]

// Base route for income endpoints.
// Example:
// POST   /api/budget/months/{budgetMonthId}/income
// PUT    /api/budget/income/{incomeId}
// PATCH  /api/budget/income/{incomeId}
// DELETE /api/budget/income/{incomeId}
[Route("api/budget")]
public class IncomeController : BudgetControllerBase
{
  // Service responsible for income business logic
  private readonly IncomeService _incomeService;

  // Constructor used for Dependency Injection (DI)
  public IncomeController(IncomeService incomeService)
  {
    _incomeService = incomeService;
  }

  // ==========================================
  // POST: api/budget/months/{budgetMonthId}/income
  // Adds a new income record to a budget month.
  // ==========================================
  [HttpPost("months/{budgetMonthId}/income")]
  public async Task<ActionResult<IncomeResponse>> AddIncome(
    string budgetMonthId,
    CreateIncomeRequest request)
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Validate that an account was selected
    if (string.IsNullOrWhiteSpace(request.AccountId))
    {
      return BadRequest("Account is required.");
    }

    // Validate that an income source was provided
    if (string.IsNullOrWhiteSpace(request.Source))
    {
      return BadRequest("Income source is required.");
    }

    // Validate that the income amount is greater than zero
    if (request.Amount <= 0)
    {
      return BadRequest("Income amount must be greater than 0.");
    }

    // Create the income record
    var income = await _incomeService.AddIncomeAsync(
      budgetMonthId,
      request,
      userId);

    // Return 404 if the budget month or account was not found
    if (income == null)
    {
      return NotFound("Budget month or account not found.");
    }

    // Return the newly created income record
    return Ok(income);
  }

  // ==========================================
  // PUT: api/budget/income/{incomeId}
  // Updates an existing income record.
  // ==========================================
  [HttpPut("income/{incomeId}")]
  public async Task<ActionResult<IncomeResponse>> UpdateIncome(
    string incomeId,
    UpdateIncomeRequest request)
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Validate that an account was selected
    if (string.IsNullOrWhiteSpace(request.AccountId))
    {
      return BadRequest("Account is required.");
    }

    // Validate that an income source was provided
    if (string.IsNullOrWhiteSpace(request.Source))
    {
      return BadRequest("Income source is required.");
    }

    // Validate that the income amount is greater than zero
    if (request.Amount <= 0)
    {
      return BadRequest("Income amount must be greater than 0.");
    }

    // Update the income record
    var updatedIncome = await _incomeService.UpdateIncomeAsync(
      incomeId,
      request,
      userId);

    // Return 404 if the income record or account was not found
    if (updatedIncome == null)
    {
      return NotFound("Income record or account not found.");
    }

    // Return the updated income record
    return Ok(updatedIncome);
  }

  // ==========================================
  // PATCH: api/budget/income/{incomeId}
  // Partially updates an existing income record.
  // Only the fields included in the request
  // will be updated.
  // ==========================================
  [HttpPatch("income/{incomeId}")]
  public async Task<ActionResult<IncomeResponse>> PatchIncome(
    string incomeId,
    PatchIncomeRequest request)
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Validate the income source if it was supplied
    if (request.Source != null && string.IsNullOrWhiteSpace(request.Source))
    {
      return BadRequest("Income source cannot be empty.");
    }

    // Validate the account if it was supplied
    if (request.AccountId != null && string.IsNullOrWhiteSpace(request.AccountId))
    {
      return BadRequest("Account cannot be empty.");
    }

    // Validate the income amount if it was supplied
    if (request.Amount.HasValue && request.Amount.Value <= 0)
    {
      return BadRequest("Income amount must be greater than 0.");
    }

    // Update only the supplied fields
    var updatedIncome = await _incomeService.PatchIncomeAsync(
      incomeId,
      request,
      userId);

    // Return 404 if the income record or account was not found
    if (updatedIncome == null)
    {
      return NotFound("Income record or account not found.");
    }

    // Return the updated income record
    return Ok(updatedIncome);
  }

  // ==========================================
  // DELETE: api/budget/income/{incomeId}
  // Deletes an existing income record.
  // ==========================================
  [HttpDelete("income/{incomeId}")]
  public async Task<ActionResult<IncomeResponse>> DeleteIncome(
    string incomeId)
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Delete the selected income record
    var deletedIncome = await _incomeService.DeleteIncomeAsync(
      incomeId,
      userId);

    // Return 404 if the income record does not exist
    // or does not belong to the current user
    if (deletedIncome == null)
    {
      return NotFound("Income record not found.");
    }

    // Return the deleted income record
    return Ok(deletedIncome);
  }
}