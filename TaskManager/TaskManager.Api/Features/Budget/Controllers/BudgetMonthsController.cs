using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

// Marks this class as an API controller.
[ApiController]

// Base route for budget month endpoints.
// Example:
// GET    /api/budget/months
// GET    /api/budget/months/{id}
// POST   /api/budget/months
// PUT    /api/budget/months/{id}
// DELETE /api/budget/months/{id}
[Route("api/budget/months")]
public class BudgetMonthsController : BudgetControllerBase
{
  // Service responsible for budget month business logic.
  private readonly BudgetMonthService _budgetMonthService;

  /*===========================================================
    BudgetMonthsController Constructor
  ===========================================================*/
  public BudgetMonthsController(
    BudgetMonthService budgetMonthService)
  {
    _budgetMonthService =
      budgetMonthService;
  }

  /*===========================================================
    GetBudgetMonths:
    => Gets all budget months for the logged-in user.

    GET /api/budget/months
  ===========================================================*/
  [HttpGet]
  public async Task<ActionResult<List<BudgetMonthResponse>>>
    GetBudgetMonths()
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    var budgetMonths =
      await _budgetMonthService
        .GetBudgetMonthsAsync(
          userId);

    return Ok(
      budgetMonths);
  }

  /*===========================================================
    GetBudgetMonthById:
    => Gets one budget month by ID.
    => Returns 404 when the budget month does not exist or
       does not belong to the logged-in user.

    GET /api/budget/months/{id}
  ===========================================================*/
  [HttpGet("{id}")]
  public async Task<ActionResult<BudgetMonthResponse>>
    GetBudgetMonthById(
      string id)
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(
        id))
    {
      return BadRequest(
        new
        {
          message =
            "Budget month ID is required."
        });
    }

    var budgetMonth =
      await _budgetMonthService
        .GetBudgetMonthByIdAsync(
          id,
          userId);

    if (budgetMonth is null)
    {
      return NotFound(
        new
        {
          message =
            "Budget month not found."
        });
    }

    return Ok(
      budgetMonth);
  }

  /*===========================================================
    CreateBudgetMonth:
    => Creates a new budget month.
    => Prevents duplicate month and year combinations.

    POST /api/budget/months
  ===========================================================*/
  [HttpPost]
  public async Task<ActionResult<BudgetMonthResponse>>
    CreateBudgetMonth(
      CreateBudgetMonthRequest request)
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (request.Month < 1 ||
        request.Month > 12)
    {
      return BadRequest(
        new
        {
          message =
            "Month must be between 1 and 12."
        });
    }

    if (request.Year < 2000)
    {
      return BadRequest(
        new
        {
          message =
            "Year is invalid."
        });
    }

    if (request.PlannedIncome < 0)
    {
      return BadRequest(
        new
        {
          message =
            "Planned income cannot be negative."
        });
    }

    var createdBudgetMonth =
      await _budgetMonthService
        .CreateBudgetMonthAsync(
          request,
          userId);

    if (createdBudgetMonth is null)
    {
      return Conflict(
        new
        {
          message =
            "A budget month already exists for this month and year."
        });
    }

    return CreatedAtAction(
      nameof(GetBudgetMonthById),
      new
      {
        id =
          createdBudgetMonth.Id
      },
      createdBudgetMonth);
  }

  /*===========================================================
    UpdateBudgetMonth:
    => Updates the planned income for an existing budget month.
    => Returns 404 when the budget month does not exist or
       does not belong to the logged-in user.

    PUT /api/budget/months/{id}
  ===========================================================*/
  [HttpPut("{id}")]
  public async Task<ActionResult<BudgetMonthResponse>>
    UpdateBudgetMonth(
      string id,
      UpdateBudgetMonthRequest request)
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(
        id))
    {
      return BadRequest(
        new
        {
          message =
            "Budget month ID is required."
        });
    }

    if (request.PlannedIncome < 0)
    {
      return BadRequest(
        new
        {
          message =
            "Planned income cannot be negative."
        });
    }

    var updatedBudgetMonth =
      await _budgetMonthService
        .UpdateBudgetMonthAsync(
          id,
          request,
          userId);

    if (updatedBudgetMonth is null)
    {
      return NotFound(
        new
        {
          message =
            "Budget month not found."
        });
    }

    return Ok(
      updatedBudgetMonth);
  }

  /*===========================================================
    DeleteBudgetMonth:
    => Deletes an existing budget month.
    => Also deletes its related budget records through the
       service's cascade-delete logic.
    => Returns 404 when the budget month does not exist or
       does not belong to the logged-in user.

    DELETE /api/budget/months/{id}
  ===========================================================*/
  [HttpDelete("{id}")]
  public async Task<ActionResult<BudgetMonthResponse>>
    DeleteBudgetMonth(
      string id)
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(
        id))
    {
      return BadRequest(
        new
        {
          message =
            "Budget month ID is required."
        });
    }

    var deletedBudgetMonth =
      await _budgetMonthService
        .DeleteBudgetMonthAsync(
          id,
          userId);

    if (deletedBudgetMonth is null)
    {
      return NotFound(
        new
        {
          message =
            "Budget month not found."
        });
    }

    return Ok(
      deletedBudgetMonth);
  }
}