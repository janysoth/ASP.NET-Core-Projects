using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

[ApiController]
[Route("api/budget/admin")]
public class BudgetAdminController : BudgetControllerBase
{
  private readonly BudgetAdminService _budgetAdminService;

  public BudgetAdminController(BudgetAdminService budgetAdminService)
  {
    _budgetAdminService = budgetAdminService;
  }

  [HttpPost("delete-all")]
  public async Task<ActionResult<CleanSlateResponse>> DeleteAllBudgetData(
    [FromBody] DeleteAllBudgetDataRequest? request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (request == null || string.IsNullOrWhiteSpace(request.Confirmation))
    {
      return BadRequest("Please confirm this action by sending { \"confirmation\": \"DELETE ALL\" }.");
    }

    if (request.Confirmation != "DELETE ALL")
    {
      return BadRequest("Confirmation text must be exactly DELETE ALL.");
    }

    var result = await _budgetAdminService.DeleteAllBudgetDataAsync(userId);

    return Ok(result);
  }
}