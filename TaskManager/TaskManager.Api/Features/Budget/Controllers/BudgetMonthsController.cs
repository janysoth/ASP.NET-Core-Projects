using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

[ApiController]
[Route("api/budget/months")]
public class BudgetMonthsController : BudgetControllerBase
{
  private readonly BudgetMonthService _budgetMonthService;

  public BudgetMonthsController(BudgetMonthService budgetMonthService)
  {
    _budgetMonthService = budgetMonthService;
  }

  [HttpGet]
  public async Task<ActionResult<List<BudgetMonthResponse>>> GetBudgetMonths()
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var budgetMonths = await _budgetMonthService.GetBudgetMonthsAsync(userId);

    return Ok(budgetMonths);
  }

  [HttpGet("{id}")]
  public async Task<ActionResult<BudgetMonthResponse>> GetBudgetMonthById(
    string id)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var budgetMonth = await _budgetMonthService.GetBudgetMonthByIdAsync(id, userId);

    if (budgetMonth == null)
    {
      return NotFound("Budget month not found.");
    }

    return Ok(budgetMonth);
  }

  [HttpPost]
  public async Task<ActionResult<BudgetMonthResponse>> CreateBudgetMonth(
    CreateBudgetMonthRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (request.Month < 1 || request.Month > 12)
    {
      return BadRequest("Month must be between 1 and 12.");
    }

    if (request.Year < 2000)
    {
      return BadRequest("Year is invalid.");
    }

    if (request.PlannedIncome < 0)
    {
      return BadRequest("Planned income cannot be negative.");
    }

    var createdBudgetMonth = await _budgetMonthService.CreateBudgetMonthAsync(
      request,
      userId);

    return CreatedAtAction(
      nameof(GetBudgetMonthById),
      new { id = createdBudgetMonth.Id },
      createdBudgetMonth);
  }

  [HttpPut("{id}")]
  public async Task<ActionResult<BudgetMonthResponse>> UpdateBudgetMonth(
    string id,
    UpdateBudgetMonthRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (request.PlannedIncome < 0)
    {
      return BadRequest("Planned income cannot be negative.");
    }

    var updatedBudgetMonth = await _budgetMonthService.UpdateBudgetMonthAsync(
      id,
      request,
      userId);

    if (updatedBudgetMonth == null)
    {
      return NotFound("Budget month not found.");
    }

    return Ok(updatedBudgetMonth);
  }

  [HttpDelete("{id}")]
  public async Task<ActionResult<BudgetMonthResponse>> DeleteBudgetMonth(
    string id)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var deletedBudgetMonth = await _budgetMonthService.DeleteBudgetMonthAsync(
      id,
      userId);

    if (deletedBudgetMonth == null)
    {
      return NotFound("Budget month not found.");
    }

    return Ok(deletedBudgetMonth);
  }
}