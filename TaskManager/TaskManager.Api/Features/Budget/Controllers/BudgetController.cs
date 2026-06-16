using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BudgetController : ControllerBase
{
  private readonly BudgetService _budgetService;

  /*=========================================================== 
  // Constructor:
  => Receives BudgetService through dependency injection.
  => Stores BudgetService in a private field so this controller
     can use it inside each endpoint.
  => The controller does not talk directly to MongoDB; it asks
     BudgetService to handle the database work.
  ===========================================================*/
  public BudgetController(BudgetService budgetService)
  {
    _budgetService = budgetService;
  }

  /*=========================================================== 
  // GetBudgetMonths:
  => Handles GET /api/budget.
  => Gets the logged-in user's Id from the JWT token.
  => Returns all budget months that belong to the logged-in user.
  => Returns Unauthorized if the user Id cannot be found.
  ===========================================================*/
  [HttpGet]
  public async Task<ActionResult<List<BudgetMonthResponse>>> GetBudgetMonths()
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var budgetMonths = await _budgetService.GetBudgetMonthsAsync(userId);

    return Ok(budgetMonths);
  }

  /*=========================================================== 
  // GetBudgetMonthById:
  => Handles GET /api/budget/{id}.
  => Gets one specific budget month by Id.
  => Makes sure the budget month belongs to the logged-in user.
  => Returns NotFound if the budget month does not exist.
  ===========================================================*/
  [HttpGet("{id}")]
  public async Task<ActionResult<BudgetMonthResponse>> GetBudgetMonthById(string id)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var budgetMonth = await _budgetService.GetBudgetMonthByIdAsync(id, userId);

    if (budgetMonth == null)
    {
      return NotFound("Budget month not found.");
    }

    return Ok(budgetMonth);
  }

  /*=========================================================== 
  // CreateBudgetMonth:
  => Handles POST /api/budget.
  => Creates a new budget month for the logged-in user.
  => Validates month, year, and planned income before saving.
  => Returns CreatedAtAction so the response includes the location
     of the newly created budget month.
  ===========================================================*/
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

    var createdBudgetMonth = await _budgetService.CreateBudgetMonthAsync(request, userId);

    return CreatedAtAction(
        nameof(GetBudgetMonthById),
        new { id = createdBudgetMonth.Id },
        createdBudgetMonth);
  }

  /*=========================================================== 
  // UpdateBudgetMonth:
  => Handles PUT /api/budget/{id}.
  => Updates the planned income for one budget month.
  => Makes sure planned income is not negative.
  => Returns NoContent if update succeeds.
  => Returns NotFound if the budget month does not exist.
  ===========================================================*/
  [HttpPut("{id}")]
  public async Task<IActionResult> UpdateBudgetMonth(
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

    var updated = await _budgetService.UpdateBudgetMonthAsync(id, request, userId);

    if (!updated)
    {
      return NotFound("Budget month not found.");
    }

    return NoContent();
  }

  /*=========================================================== 
  // DeleteBudgetMonth:
  => Handles DELETE /api/budget/{id}.
  => Deletes one budget month that belongs to the logged-in user.
  => The service also deletes income and expense records connected
     to that budget month.
  => Returns NoContent if delete succeeds.
  ===========================================================*/
  [HttpDelete("{id}")]
  public async Task<IActionResult> DeleteBudgetMonth(string id)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var deleted = await _budgetService.DeleteBudgetMonthAsync(id, userId);

    if (!deleted)
    {
      return NotFound("Budget month not found.");
    }

    return NoContent();
  }

  /*=========================================================== 
  // AddIncome:
  => Handles POST /api/budget/{budgetMonthId}/income.
  => Adds a new income record to a budget month.
  => Validates that source is not empty and amount is greater than 0.
  => Returns NotFound if the budget month does not exist.
  ===========================================================*/
  [HttpPost("{budgetMonthId}/income")]
  public async Task<ActionResult<IncomeResponse>> AddIncome(
      string budgetMonthId,
      CreateIncomeRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(request.Source))
    {
      return BadRequest("Income source is required.");
    }

    if (request.Amount <= 0)
    {
      return BadRequest("Income amount must be greater than 0.");
    }

    var income = await _budgetService.AddIncomeAsync(budgetMonthId, request, userId);

    if (income == null)
    {
      return NotFound("Budget month not found.");
    }

    return Ok(income);
  }

  /*=========================================================== 
  // UpdateIncome:
  => Handles PUT /api/budget/income/{incomeId}.
  => Updates an existing income record.
  => Validates that source is not empty and amount is greater than 0.
  => Returns NotFound if the income record does not exist.
  ===========================================================*/
  [HttpPut("income/{incomeId}")]
  public async Task<IActionResult> UpdateIncome(
      string incomeId,
      UpdateIncomeRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(request.Source))
    {
      return BadRequest("Income source is required.");
    }

    if (request.Amount <= 0)
    {
      return BadRequest("Income amount must be greater than 0.");
    }

    var updated = await _budgetService.UpdateIncomeAsync(incomeId, request, userId);

    if (!updated)
    {
      return NotFound("Income record not found.");
    }

    return NoContent();
  }

  /*=========================================================== 
  // DeleteIncome:
  => Handles DELETE /api/budget/income/{incomeId}.
  => Deletes one income record that belongs to the logged-in user.
  => Returns NotFound if the income record does not exist.
  => Returns NoContent if delete succeeds.
  ===========================================================*/
  [HttpDelete("income/{incomeId}")]
  public async Task<IActionResult> DeleteIncome(string incomeId)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var deleted = await _budgetService.DeleteIncomeAsync(incomeId, userId);

    if (!deleted)
    {
      return NotFound("Income record not found.");
    }

    return NoContent();
  }

  /*=========================================================== 
  // AddExpense:
  => Handles POST /api/budget/{budgetMonthId}/expense.
  => Adds a new expense record to a budget month.
  => Validates that category, name, and amount are valid.
  => Returns NotFound if the budget month does not exist.
  ===========================================================*/
  [HttpPost("{budgetMonthId}/expense")]
  public async Task<ActionResult<ExpenseResponse>> AddExpense(
      string budgetMonthId,
      CreateExpenseRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
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

    var expense = await _budgetService.AddExpenseAsync(budgetMonthId, request, userId);

    if (expense == null)
    {
      return NotFound("Budget month not found.");
    }

    return Ok(expense);
  }

  /*=========================================================== 
  // UpdateExpense:
  => Handles PUT /api/budget/expense/{expenseId}.
  => Updates an existing expense record.
  => Validates that category, name, and amount are valid.
  => Returns NotFound if the expense record does not exist.
  ===========================================================*/
  [HttpPut("expense/{expenseId}")]
  public async Task<IActionResult> UpdateExpense(
      string expenseId,
      UpdateExpenseRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
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

    var updated = await _budgetService.UpdateExpenseAsync(expenseId, request, userId);

    if (!updated)
    {
      return NotFound("Expense record not found.");
    }

    return NoContent();
  }

  /*=========================================================== 
  // DeleteExpense:
  => Handles DELETE /api/budget/expense/{expenseId}.
  => Deletes one expense record that belongs to the logged-in user.
  => Returns NotFound if the expense record does not exist.
  => Returns NoContent if delete succeeds.
  ===========================================================*/
  [HttpDelete("expense/{expenseId}")]
  public async Task<IActionResult> DeleteExpense(string expenseId)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var deleted = await _budgetService.DeleteExpenseAsync(expenseId, userId);

    if (!deleted)
    {
      return NotFound("Expense record not found.");
    }

    return NoContent();
  }

  /*=========================================================== 
  // GetUserId:
  => Helper method that reads the logged-in user's Id from the JWT token.
  => First tries ClaimTypes.NameIdentifier.
  => If that is not found, tries "id".
  => If that is not found, tries "sub".
  => Returns null if no user Id claim exists.
  ===========================================================*/
  private string? GetUserId()
  {
    return User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("id")
        ?? User.FindFirstValue("sub");
  }
}