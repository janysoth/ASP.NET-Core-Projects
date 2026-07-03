using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

[ApiController]
[Route("api/budget")]
public class ExpensesController : BudgetControllerBase
{
  private readonly ExpenseService _expenseService;

  public ExpensesController(ExpenseService expenseService)
  {
    _expenseService = expenseService;
  }

  [HttpPost("months/{budgetMonthId}/expense")]
  public async Task<ActionResult<ExpenseResponse>> AddExpense(
    string budgetMonthId,
    CreateExpenseRequest request)
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

    if (string.IsNullOrWhiteSpace(request.Category))
    {
      return BadRequest("Expense category is required.");
    }

    if (string.IsNullOrWhiteSpace(request.Name))
    {
      return BadRequest("Expense name is required.");
    }

    if (request.Amount <= 0)
    {
      return BadRequest("Expense amount must be greater than 0.");
    }

    var expense = await _expenseService.AddExpenseAsync(
      budgetMonthId,
      request,
      userId);

    if (expense == null)
    {
      return NotFound("Budget month or account not found.");
    }

    return Ok(expense);
  }

  [HttpPut("expense/{expenseId}")]
  public async Task<ActionResult<ExpenseResponse>> UpdateExpense(
    string expenseId,
    UpdateExpenseRequest request)
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

    if (string.IsNullOrWhiteSpace(request.Category))
    {
      return BadRequest("Expense category is required.");
    }

    if (string.IsNullOrWhiteSpace(request.Name))
    {
      return BadRequest("Expense name is required.");
    }

    if (request.Amount <= 0)
    {
      return BadRequest("Expense amount must be greater than 0.");
    }

    var updatedExpense = await _expenseService.UpdateExpenseAsync(
      expenseId,
      request,
      userId);

    if (updatedExpense == null)
    {
      return NotFound("Expense record or account not found.");
    }

    return Ok(updatedExpense);
  }

  [HttpPatch("expense/{expenseId}")]
  public async Task<ActionResult<ExpenseResponse>> PatchExpense(
    string expenseId,
    PatchExpenseRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (request.AccountId != null && string.IsNullOrWhiteSpace(request.AccountId))
    {
      return BadRequest("Account cannot be empty.");
    }

    if (request.Category != null && string.IsNullOrWhiteSpace(request.Category))
    {
      return BadRequest("Expense category cannot be empty.");
    }

    if (request.Name != null && string.IsNullOrWhiteSpace(request.Name))
    {
      return BadRequest("Expense name cannot be empty.");
    }

    if (request.Amount.HasValue && request.Amount.Value <= 0)
    {
      return BadRequest("Expense amount must be greater than 0.");
    }

    var updatedExpense = await _expenseService.PatchExpenseAsync(
      expenseId,
      request,
      userId);

    if (updatedExpense == null)
    {
      return NotFound("Expense record or account not found.");
    }

    return Ok(updatedExpense);
  }

  [HttpDelete("expense/{expenseId}")]
  public async Task<ActionResult<ExpenseResponse>> DeleteExpense(
    string expenseId)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var deletedExpense = await _expenseService.DeleteExpenseAsync(
      expenseId,
      userId);

    if (deletedExpense == null)
    {
      return NotFound("Expense record not found.");
    }

    return Ok(deletedExpense);
  }
}