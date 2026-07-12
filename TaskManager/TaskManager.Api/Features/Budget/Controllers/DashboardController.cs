using Microsoft.AspNetCore.Mvc;
// using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

// Marks this class as an API controller.
[ApiController]

// Base route for dashboard endpoints.
// Example:
// GET /api/budget/dashboard?month=7&year=2026
[Route("api/budget/dashboard")]
public class DashboardController : BudgetControllerBase
{
  // Service responsible for dashboard business logic
  private readonly DashboardService _dashboardService;

  // Constructor used for Dependency Injection (DI)
  public DashboardController(DashboardService dashboardService)
  {
    _dashboardService = dashboardService;
  }

  // ==========================================
  // GET: api/budget/dashboard
  // Returns a dashboard summary for the selected
  // month and year.
  // ==========================================
  [HttpGet]
  public async Task<ActionResult<DashboardSummaryResponse>> GetDashboardSummary(
    [FromQuery] int month,
    [FromQuery] int year)
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Validate that the month is between January (1)
    // and December (12)
    if (month < 1 || month > 12)
    {
      return BadRequest("Month must be between 1 and 12.");
    }

    // Validate that the year is reasonable
    if (year < 2000)
    {
      return BadRequest("Year is invalid.");
    }

    // Build the dashboard summary for the selected
    // month and year
    var summary = await _dashboardService.GetDashboardSummaryAsync(
      userId,
      month,
      year);

    // Return the dashboard summary
    return Ok(summary);
  }
}