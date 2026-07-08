using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

// Marks this class as an API controller.
[ApiController]

// Base route for expense endpoints.
// Example:
// POST   /api/budget/months/{budgetMonthId}/expense
// PUT    /api/budget/expense/{expenseId}
// PATCH  /api/budget/expense/{expenseId}
// DELETE /api/budget/expense/{expenseId}
[Route("api/budget")]
public class ExpensesController : BudgetControllerBase
{
  // Service responsible for expense business logic
  private readonly ExpenseService _expenseService;

  // Constructor used for Dependency Injection (DI)
  public ExpensesController(ExpenseService expenseService)
  {
    _expenseService = expenseService;
  }

  // ==========================================
  // POST: api/budget/months/{budgetMonthId}/expense
  // Adds a new expense record to a budget month.
  // ==========================================
  [HttpPost("months/{budgetMonthId}/expense")]
  public async Task<ActionResult<ExpenseResponse>> AddExpense(
    string budgetMonthId,
    CreateExpenseRequest request)
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

    // Validate that an expense category was provided
    if (string.IsNullOrWhiteSpace(request.Category))
    {
      return BadRequest("Expense category is required.");
    }

    // Validate that an expense name was provided
    if (string.IsNullOrWhiteSpace(request.Name))
    {
      return BadRequest("Expense name is required.");
    }

    // Validate that the expense amount is greater than zero
    if (request.Amount <= 0)
    {
      return BadRequest("Expense amount must be greater than 0.");
    }

    // Create the expense record
    var expense = await _expenseService.AddExpenseAsync(
      budgetMonthId,
      request,
      userId);

    // Return 404 if the budget month or account was not found
    if (expense == null)
    {
      return NotFound("Budget month or account not found.");
    }

    // Return the newly created expense
    return Ok(expense);
  }

  // ==========================================
  // PUT: api/budget/expense/{expenseId}
  // Updates an existing expense record.
  // ==========================================
  [HttpPut("expense/{expenseId}")]
  public async Task<ActionResult<ExpenseResponse>> UpdateExpense(
    string expenseId,
    UpdateExpenseRequest request)
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

    // Validate that an expense category was provided
    if (string.IsNullOrWhiteSpace(request.Category))
    {
      return BadRequest("Expense category is required.");
    }

    // Validate that an expense name was provided
    if (string.IsNullOrWhiteSpace(request.Name))
    {
      return BadRequest("Expense name is required.");
    }

    // Validate that the expense amount is greater than zero
    if (request.Amount <= 0)
    {
      return BadRequest("Expense amount must be greater than 0.");
    }

    // Update the expense record
    var updatedExpense = await _expenseService.UpdateExpenseAsync(
      expenseId,
      request,
      userId);

    // Return 404 if the expense record or account was not found
    if (updatedExpense == null)
    {
      return NotFound("Expense record or account not found.");
    }

    // Return the updated expense
    return Ok(updatedExpense);
  }

  // ==========================================
  // PATCH: api/budget/expense/{expenseId}
  // Partially updates an existing expense record.
  // Only the fields included in the request
  // will be updated.
  // ==========================================
  [HttpPatch("expense/{expenseId}")]
  public async Task<ActionResult<ExpenseResponse>> PatchExpense(
    string expenseId,
    PatchExpenseRequest request)
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Validate the account if it was supplied
    if (request.AccountId != null && string.IsNullOrWhiteSpace(request.AccountId))
    {
      return BadRequest("Account cannot be empty.");
    }

    // Validate the expense category if it was supplied
    if (request.Category != null && string.IsNullOrWhiteSpace(request.Category))
    {
      return BadRequest("Expense category cannot be empty.");
    }

    // Validate the expense name if it was supplied
    if (request.Name != null && string.IsNullOrWhiteSpace(request.Name))
    {
      return BadRequest("Expense name cannot be empty.");
    }

    // Validate the expense amount if it was supplied
    if (request.Amount.HasValue && request.Amount.Value <= 0)
    {
      return BadRequest("Expense amount must be greater than 0.");
    }

    // Update only the supplied fields
    var updatedExpense = await _expenseService.PatchExpenseAsync(
      expenseId,
      request,
      userId);

    // Return 404 if the expense record or account was not found
    if (updatedExpense == null)
    {
      return NotFound("Expense record or account not found.");
    }

    // Return the updated expense
    return Ok(updatedExpense);
  }

  // ==========================================
  // DELETE: api/budget/expense/{expenseId}
  // Deletes an existing expense record.
  // ==========================================
  [HttpDelete("expense/{expenseId}")]
  public async Task<ActionResult<ExpenseResponse>> DeleteExpense(
    string expenseId)
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Delete the selected expense
    var deletedExpense = await _expenseService.DeleteExpenseAsync(
      expenseId,
      userId);

    // Return 404 if the expense record does not exist
    // or does not belong to the current user
    if (deletedExpense == null)
    {
      return NotFound("Expense record not found.");
    }

    // Return the deleted expense
    return Ok(deletedExpense);
  }
}