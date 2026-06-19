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
  => Receives BudgetService from dependency injection.
  => Allows this controller to call budget-related database logic.
  ===========================================================*/
  public BudgetController(BudgetService budgetService)
  {
    _budgetService = budgetService;
  }

  /*===========================================================
  // GetBudgetMonths:
  => GET: /api/budget
  => Gets all budget months for the logged-in user.
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
  => GET: /api/budget/{id}
  => Gets one budget month by Id.
  => Only returns the budget month if it belongs to the user.
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
  => POST: /api/budget
  => Creates a new budget month for the logged-in user.
  => Validates month, year, and planned income before saving.
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
  => PUT: /api/budget/{id}
  => Updates the planned income for a budget month.
  => Returns NotFound if the budget month does not belong to the user.
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
  => DELETE: /api/budget/{id}
  => Deletes one budget month.
  => Also deletes its connected categories, income, and expense records.
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
  // AddBudgetCategory:
  => POST: /api/budget/{budgetMonthId}/categories
  => Adds a planned spending category to a budget month.
  => Validates category name and planned amount before saving.
  ===========================================================*/
  [HttpPost("{budgetMonthId}/categories")]
  public async Task<ActionResult<BudgetCategoryResponse>> AddBudgetCategory(
      string budgetMonthId,
      CreateBudgetCategoryRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(request.Name))
    {
      return BadRequest("Category name is required.");
    }

    if (request.PlannedAmount < 0)
    {
      return BadRequest("Planned amount cannot be negative.");
    }

    var category = await _budgetService.AddBudgetCategoryAsync(
        budgetMonthId,
        request,
        userId);

    if (category == null)
    {
      return NotFound("Budget month not found.");
    }

    return Ok(category);
  }

  /*===========================================================
  // UpdateBudgetCategory:
  => PUT: /api/budget/categories/{categoryId}
  => Updates a budget category name and planned amount.
  => Only updates the category if it belongs to the user.
  ===========================================================*/
  [HttpPut("categories/{categoryId}")]
  public async Task<IActionResult> UpdateBudgetCategory(
      string categoryId,
      UpdateBudgetCategoryRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(request.Name))
    {
      return BadRequest("Category name is required.");
    }

    if (request.PlannedAmount < 0)
    {
      return BadRequest("Planned amount cannot be negative.");
    }

    var updated = await _budgetService.UpdateBudgetCategoryAsync(
        categoryId,
        request,
        userId);

    if (!updated)
    {
      return NotFound("Budget category not found.");
    }

    return NoContent();
  }

  /*===========================================================
  // DeleteBudgetCategory:
  => DELETE: /api/budget/categories/{categoryId}
  => Deletes one budget category.
  => Does not delete expense records that used that category name.
  ===========================================================*/
  [HttpDelete("categories/{categoryId}")]
  public async Task<IActionResult> DeleteBudgetCategory(string categoryId)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var deleted = await _budgetService.DeleteBudgetCategoryAsync(categoryId, userId);

    if (!deleted)
    {
      return NotFound("Budget category not found.");
    }

    return NoContent();
  }

  /*===========================================================
  // AddIncome:
  => POST: /api/budget/{budgetMonthId}/income
  => Adds a new income record to a budget month.
  => Validates source and amount before saving.
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
  => PUT: /api/budget/income/{incomeId}
  => Updates an existing income record.
  => Only updates it if it belongs to the logged-in user.
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
  => DELETE: /api/budget/income/{incomeId}
  => Deletes one income record.
  => Only deletes it if it belongs to the logged-in user.
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
  => POST: /api/budget/{budgetMonthId}/expense
  => Adds a new expense record to a budget month.
  => Validates category, name, and amount before saving.
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
  => PUT: /api/budget/expense/{expenseId}
  => Updates an existing expense record.
  => Only updates it if it belongs to the logged-in user.
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
  => DELETE: /api/budget/expense/{expenseId}
  => Deletes one expense record.
  => Only deletes it if it belongs to the logged-in user.
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
  => Reads the logged-in user's Id from the JWT token claims.
  => Tries ClaimTypes.NameIdentifier first.
  => Falls back to "id" or "sub" depending on how the token was created.
  ===========================================================*/
  private string? GetUserId()
  {
    return User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("id")
        ?? User.FindFirstValue("sub");
  }
}