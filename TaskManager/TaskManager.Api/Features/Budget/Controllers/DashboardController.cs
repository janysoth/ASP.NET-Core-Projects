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

  /*===========================================================
   GetDashboardSummary:
   => Returns the dashboard summary for a selected
      budget month.

   GET /api/budget/dashboard?month=7&year=2026
 ===========================================================*/
  [HttpGet]
  public async Task<ActionResult<DashboardSummaryResponse>>
    GetDashboardSummary(
      [FromQuery] int month,
      [FromQuery] int year)
  {
    /*---------------------------------------------------------
      Get the authenticated user's ID
    ---------------------------------------------------------*/
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    /*---------------------------------------------------------
      Validate month
    ---------------------------------------------------------*/
    if (month < 1 || month > 12)
    {
      return BadRequest(
        new
        {
          message =
            "Month must be between 1 and 12."
        });
    }

    /*---------------------------------------------------------
      Validate year
    ---------------------------------------------------------*/
    if (year < 2000)
    {
      return BadRequest(
        new
        {
          message =
            "Year is invalid."
        });
    }

    /*---------------------------------------------------------
      Build dashboard summary
    ---------------------------------------------------------*/
    var summary =
      await _dashboardService.GetDashboardSummaryAsync(
        userId,
        month,
        year);

    return Ok(
      summary);
  }

}