using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

// Marks this class as an API controller.
[ApiController]

// Base route for budget month endpoints.
// Example:
// GET    /api/budget/months
// GET    /api/budget/months/{id}
// POST   /api/budget/months
// PUT    /api/budget/months/{id}
// DELETE /api/budget/months/{id}
[Route("api/budget/months")]
public class BudgetMonthsController : BudgetControllerBase
{
  // Service responsible for budget month business logic
  private readonly BudgetMonthService _budgetMonthService;

  // Constructor used for Dependency Injection (DI)
  public BudgetMonthsController(BudgetMonthService budgetMonthService)
  {
    _budgetMonthService = budgetMonthService;
  }

  // ==========================================
  // GET: api/budget/months
  // Gets all budget months for the logged-in user.
  // ==========================================
  [HttpGet]
  public async Task<ActionResult<List<BudgetMonthResponse>>> GetBudgetMonths()
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Get all budget months that belong to this user
    var budgetMonths = await _budgetMonthService.GetBudgetMonthsAsync(userId);

    // Return the budget month list
    return Ok(budgetMonths);
  }

  // ==========================================
  // GET: api/budget/months/{id}
  // Gets one budget month by ID.
  // ==========================================
  [HttpGet("{id}")]
  public async Task<ActionResult<BudgetMonthResponse>> GetBudgetMonthById(
    string id)
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Get the selected budget month
    var budgetMonth = await _budgetMonthService.GetBudgetMonthByIdAsync(id, userId);

    // Return 404 if the budget month does not exist
    // or does not belong to the current user
    if (budgetMonth == null)
    {
      return NotFound("Budget month not found.");
    }

    // Return the selected budget month
    return Ok(budgetMonth);
  }

  // ==========================================
  // POST: api/budget/months
  // Creates a new budget month.
  // ==========================================
  [HttpPost]
  public async Task<ActionResult<BudgetMonthResponse>> CreateBudgetMonth(
    CreateBudgetMonthRequest request)
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Validate that month is between January and December
    if (request.Month < 1 || request.Month > 12)
    {
      return BadRequest("Month must be between 1 and 12.");
    }

    // Validate that the year is reasonable
    if (request.Year < 2000)
    {
      return BadRequest("Year is invalid.");
    }

    // Prevent negative planned income
    if (request.PlannedIncome < 0)
    {
      return BadRequest("Planned income cannot be negative.");
    }

    // Create the budget month
    var createdBudgetMonth = await _budgetMonthService.CreateBudgetMonthAsync(
      request,
      userId);

    // Return HTTP 201 Created with a link to the new budget month
    return CreatedAtAction(
      nameof(GetBudgetMonthById),
      new { id = createdBudgetMonth.Id },
      createdBudgetMonth);
  }

  // ==========================================
  // PUT: api/budget/months/{id}
  // Updates an existing budget month.
  // ==========================================
  [HttpPut("{id}")]
  public async Task<ActionResult<BudgetMonthResponse>> UpdateBudgetMonth(
    string id,
    UpdateBudgetMonthRequest request)
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Prevent negative planned income
    if (request.PlannedIncome < 0)
    {
      return BadRequest("Planned income cannot be negative.");
    }

    // Update the selected budget month
    var updatedBudgetMonth = await _budgetMonthService.UpdateBudgetMonthAsync(
      id,
      request,
      userId);

    // Return 404 if the budget month does not exist
    // or does not belong to the current user
    if (updatedBudgetMonth == null)
    {
      return NotFound("Budget month not found.");
    }

    // Return the updated budget month
    return Ok(updatedBudgetMonth);
  }

  // ==========================================
  // DELETE: api/budget/months/{id}
  // Deletes an existing budget month.
  // ==========================================
  [HttpDelete("{id}")]
  public async Task<ActionResult<BudgetMonthResponse>> DeleteBudgetMonth(
    string id)
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Delete the selected budget month
    var deletedBudgetMonth = await _budgetMonthService.DeleteBudgetMonthAsync(
      id,
      userId);

    // Return 404 if the budget month does not exist
    // or does not belong to the current user
    if (deletedBudgetMonth == null)
    {
      return NotFound("Budget month not found.");
    }

    // Return the deleted budget month
    return Ok(deletedBudgetMonth);
  }
}