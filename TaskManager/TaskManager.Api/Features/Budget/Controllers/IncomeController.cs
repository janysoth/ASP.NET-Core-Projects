using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

[ApiController]
[Route("api/budget")]
public class IncomeController : BudgetControllerBase
{
  private readonly IncomeService _incomeService;

  public IncomeController(IncomeService incomeService)
  {
    _incomeService = incomeService;
  }

  [HttpPost("months/{budgetMonthId}/income")]
  public async Task<ActionResult<IncomeResponse>> AddIncome(
    string budgetMonthId,
    CreateIncomeRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(request.AccountId))
    {
      return BadRequest("Account is required.");
    }

    if (string.IsNullOrWhiteSpace(request.Source))
    {
      return BadRequest("Income source is required.");
    }

    if (request.Amount <= 0)
    {
      return BadRequest("Income amount must be greater than 0.");
    }

    var income = await _incomeService.AddIncomeAsync(
      budgetMonthId,
      request,
      userId);

    if (income == null)
    {
      return NotFound("Budget month or account not found.");
    }

    return Ok(income);
  }

  [HttpPut("income/{incomeId}")]
  public async Task<ActionResult<IncomeResponse>> UpdateIncome(
    string incomeId,
    UpdateIncomeRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(request.AccountId))
    {
      return BadRequest("Account is required.");
    }

    if (string.IsNullOrWhiteSpace(request.Source))
    {
      return BadRequest("Income source is required.");
    }

    if (request.Amount <= 0)
    {
      return BadRequest("Income amount must be greater than 0.");
    }

    var updatedIncome = await _incomeService.UpdateIncomeAsync(
      incomeId,
      request,
      userId);

    if (updatedIncome == null)
    {
      return NotFound("Income record or account not found.");
    }

    return Ok(updatedIncome);
  }

  [HttpPatch("income/{incomeId}")]
  public async Task<ActionResult<IncomeResponse>> PatchIncome(
    string incomeId,
    PatchIncomeRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (request.Source != null && string.IsNullOrWhiteSpace(request.Source))
    {
      return BadRequest("Income source cannot be empty.");
    }

    if (request.AccountId != null && string.IsNullOrWhiteSpace(request.AccountId))
    {
      return BadRequest("Account cannot be empty.");
    }

    if (request.Amount.HasValue && request.Amount.Value <= 0)
    {
      return BadRequest("Income amount must be greater than 0.");
    }

    var updatedIncome = await _incomeService.PatchIncomeAsync(
      incomeId,
      request,
      userId);

    if (updatedIncome == null)
    {
      return NotFound("Income record or account not found.");
    }

    return Ok(updatedIncome);
  }

  [HttpDelete("income/{incomeId}")]
  public async Task<ActionResult<IncomeResponse>> DeleteIncome(
    string incomeId)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var deletedIncome = await _incomeService.DeleteIncomeAsync(
      incomeId,
      userId);

    if (deletedIncome == null)
    {
      return NotFound("Income record not found.");
    }

    return Ok(deletedIncome);
  }
}