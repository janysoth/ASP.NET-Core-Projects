using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

[ApiController]
[Route("api/budget")]
public sealed class ExpenseController : BudgetControllerBase
{
  private readonly ExpenseService _expenseService;

  /*===========================================================
    ExpenseController Constructor
  ===========================================================*/
  public ExpenseController(
    ExpenseService expenseService)
  {
    _expenseService = expenseService;
  }

  /*===========================================================
    GetExpenses:
    => Gets all expenses owned by the current user.
    => Can optionally filter by month and year.

    Examples:
    GET /api/budget/expenses
    GET /api/budget/expenses?month=7&year=2026
    GET /api/budget/expenses?year=2026
  ===========================================================*/
  [HttpGet("expenses")]
  public async Task<ActionResult<List<ExpenseResponse>>>
    GetExpenses(
      [FromQuery] int? month,
      [FromQuery] int? year)
  {
    var userId = GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    // DateTime.Month uses:
    //
    // January = 1
    // December = 12
    if (month.HasValue &&
        (month.Value < 1 || month.Value > 12))
    {
      return BadRequest(
        "Month must be between 1 and 12.");
    }

    if (year.HasValue && year.Value < 2000)
    {
      return BadRequest(
        "Year is invalid.");
    }

    var expenses =
      await _expenseService.GetExpensesAsync(
        userId,
        month,
        year);

    return Ok(expenses);
  }

  /*===========================================================
    GetExpenseById:
    => Gets one expense owned by the current user.

    GET /api/budget/expenses/{expenseId}
  ===========================================================*/
  [HttpGet("expenses/{expenseId}")]
  public async Task<ActionResult<ExpenseResponse>>
    GetExpenseById(
      string expenseId)
  {
    var userId = GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(expenseId))
    {
      return BadRequest(
        "Expense ID is required.");
    }

    var expense =
      await _expenseService.GetExpenseByIdAsync(
        expenseId,
        userId);

    if (expense is null)
    {
      return NotFound(
        "Expense was not found.");
    }

    return Ok(expense);
  }

  /*===========================================================
    AddExpense:
    => Creates a new expense inside a budget month.
    => Requires an AccountId and CategoryId.

    POST /api/budget/months/{budgetMonthId}/expenses
  ===========================================================*/
  [HttpPost("months/{budgetMonthId}/expenses")]
  public async Task<ActionResult<ExpenseResponse>>
    AddExpense(
      string budgetMonthId,
      [FromBody] CreateExpenseRequest request)
  {
    var userId = GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(budgetMonthId))
    {
      return BadRequest(
        "Budget month ID is required.");
    }

    if (string.IsNullOrWhiteSpace(request.AccountId))
    {
      return BadRequest(
        "AccountId is required.");
    }

    // Expenses now reference the category by ID
    // instead of storing the category name.
    if (string.IsNullOrWhiteSpace(request.CategoryId))
    {
      return BadRequest(
        "CategoryId is required.");
    }

    if (string.IsNullOrWhiteSpace(request.Name))
    {
      return BadRequest(
        "Expense name is required.");
    }

    if (request.Amount <= 0)
    {
      return BadRequest(
        "Expense amount must be greater than zero.");
    }

    if (request.ExpenseDate == default)
    {
      return BadRequest(
        "Expense date is required.");
    }

    var expense =
      await _expenseService.AddExpenseAsync(
        budgetMonthId,
        request,
        userId);

    if (expense is null)
    {
      return BadRequest(
        "Unable to create expense. Verify the budget month, " +
        "account, category, category type, and expense date.");
    }

    return CreatedAtAction(
      nameof(GetExpenseById),
      new
      {
        expenseId = expense.Id
      },
      expense);
  }

  /*===========================================================
    UpdateExpense:
    => Completely updates an existing expense.
    => PUT expects all editable expense fields.

    PUT /api/budget/expenses/{expenseId}
  ===========================================================*/
  [HttpPut("expenses/{expenseId}")]
  public async Task<ActionResult<ExpenseResponse>>
    UpdateExpense(
      string expenseId,
      [FromBody] UpdateExpenseRequest request)
  {
    var userId = GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(expenseId))
    {
      return BadRequest(
        "Expense ID is required.");
    }

    if (string.IsNullOrWhiteSpace(request.AccountId))
    {
      return BadRequest(
        "AccountId is required.");
    }

    // This used to validate request.Category.
    //
    // The new expense architecture uses CategoryId.
    if (string.IsNullOrWhiteSpace(request.CategoryId))
    {
      return BadRequest(
        "CategoryId is required.");
    }

    if (string.IsNullOrWhiteSpace(request.Name))
    {
      return BadRequest(
        "Expense name is required.");
    }

    if (request.Amount <= 0)
    {
      return BadRequest(
        "Expense amount must be greater than zero.");
    }

    if (request.ExpenseDate == default)
    {
      return BadRequest(
        "Expense date is required.");
    }

    var expense =
      await _expenseService.UpdateExpenseAsync(
        expenseId,
        request,
        userId);

    if (expense is null)
    {
      return NotFound(
        "Unable to update expense. Verify the expense, account, " +
        "category, category type, and expense date.");
    }

    return Ok(expense);
  }

  /*===========================================================
    PatchExpense:
    => Partially updates an existing expense.
    => Only supplied fields are changed.

    PATCH /api/budget/expenses/{expenseId}
  ===========================================================*/
  [HttpPatch("expenses/{expenseId}")]
  public async Task<ActionResult<ExpenseResponse>>
    PatchExpense(
      string expenseId,
      [FromBody] PatchExpenseRequest request)
  {
    var userId = GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(expenseId))
    {
      return BadRequest(
        "Expense ID is required.");
    }

    if (request.Amount.HasValue &&
        request.Amount.Value <= 0)
    {
      return BadRequest(
        "Expense amount must be greater than zero.");
    }

    var expense =
      await _expenseService.PatchExpenseAsync(
        expenseId,
        request,
        userId);

    if (expense is null)
    {
      return NotFound(
        "Unable to update expense. Verify the expense and any " +
        "account or category values supplied.");
    }

    return Ok(expense);
  }

  /*===========================================================
    DeleteExpense:
    => Deletes one expense owned by the current user.
    => Returns the deleted expense.

    DELETE /api/budget/expenses/{expenseId}
  ===========================================================*/
  [HttpDelete("expenses/{expenseId}")]
  public async Task<ActionResult<ExpenseResponse>>
    DeleteExpense(
      string expenseId)
  {
    var userId = GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(expenseId))
    {
      return BadRequest(
        "Expense ID is required.");
    }

    var expense =
      await _expenseService.DeleteExpenseAsync(
        expenseId,
        userId);

    if (expense is null)
    {
      return NotFound(
        "Expense was not found.");
    }

    return Ok(expense);
  }
}