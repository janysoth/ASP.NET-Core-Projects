using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

[ApiController]
[Route("api/budget")]
public class IncomeController : BudgetControllerBase
{
  private readonly IncomeService _incomeService;

  /*===========================================================
    IncomeController Constructor
  ===========================================================*/
  public IncomeController(
    IncomeService incomeService)
  {
    _incomeService =
      incomeService;
  }

  /*===========================================================
    AddIncome:
    => Adds a new income record to a selected budget month.
    => The income date must belong to that budget month.

    POST /api/budget/months/{budgetMonthId}/income
  ===========================================================*/
  [HttpPost("months/{budgetMonthId}/income")]
  public async Task<ActionResult<IncomeResponse>>
    AddIncome(
      string budgetMonthId,
      CreateIncomeRequest request)
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(
        budgetMonthId))
    {
      return BadRequest(
        new
        {
          message =
            "Budget month ID is required."
        });
    }

    if (string.IsNullOrWhiteSpace(
        request.AccountId))
    {
      return BadRequest(
        new
        {
          message =
            "Account is required."
        });
    }

    if (string.IsNullOrWhiteSpace(
        request.Source))
    {
      return BadRequest(
        new
        {
          message =
            "Income source is required."
        });
    }

    if (request.Amount <= 0)
    {
      return BadRequest(
        new
        {
          message =
            "Income amount must be greater than 0."
        });
    }

    if (request.IncomeDate == default)
    {
      return BadRequest(
        new
        {
          message =
            "Income date is required."
        });
    }

    try
    {
      var income =
        await _incomeService.AddIncomeAsync(
          budgetMonthId,
          request,
          userId);

      if (income is null)
      {
        return NotFound(
          new
          {
            message =
              "Budget month or account not found."
          });
      }

      return Ok(
        income);
    }
    catch (ArgumentException exception)
    {
      return BadRequest(
        new
        {
          message =
            exception.Message
        });
    }
  }

  /*===========================================================
    UpdateIncome:
    => Completely updates an existing income record.
    => The income date must remain inside its original
       budget month.

    PUT /api/budget/income/{incomeId}
  ===========================================================*/
  [HttpPut("income/{incomeId}")]
  public async Task<ActionResult<IncomeResponse>>
    UpdateIncome(
      string incomeId,
      UpdateIncomeRequest request)
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(
        incomeId))
    {
      return BadRequest(
        new
        {
          message =
            "Income record ID is required."
        });
    }

    if (string.IsNullOrWhiteSpace(
        request.AccountId))
    {
      return BadRequest(
        new
        {
          message =
            "Account is required."
        });
    }

    if (string.IsNullOrWhiteSpace(
        request.Source))
    {
      return BadRequest(
        new
        {
          message =
            "Income source is required."
        });
    }

    if (request.Amount <= 0)
    {
      return BadRequest(
        new
        {
          message =
            "Income amount must be greater than 0."
        });
    }

    if (request.IncomeDate == default)
    {
      return BadRequest(
        new
        {
          message =
            "Income date is required."
        });
    }

    try
    {
      var updatedIncome =
        await _incomeService.UpdateIncomeAsync(
          incomeId,
          request,
          userId);

      if (updatedIncome is null)
      {
        return NotFound(
          new
          {
            message =
              "Income record or account not found."
          });
      }

      return Ok(
        updatedIncome);
    }
    catch (ArgumentException exception)
    {
      return BadRequest(
        new
        {
          message =
            exception.Message
        });
    }
  }

  /*===========================================================
    PatchIncome:
    => Partially updates an existing income record.
    => Only supplied fields are changed.
    => A supplied income date must remain inside the
       income record's original budget month.

    PATCH /api/budget/income/{incomeId}
  ===========================================================*/
  [HttpPatch("income/{incomeId}")]
  public async Task<ActionResult<IncomeResponse>>
    PatchIncome(
      string incomeId,
      PatchIncomeRequest request)
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(
        incomeId))
    {
      return BadRequest(
        new
        {
          message =
            "Income record ID is required."
        });
    }

    if (request.Source is not null &&
        string.IsNullOrWhiteSpace(
          request.Source))
    {
      return BadRequest(
        new
        {
          message =
            "Income source cannot be empty."
        });
    }

    if (request.AccountId is not null &&
        string.IsNullOrWhiteSpace(
          request.AccountId))
    {
      return BadRequest(
        new
        {
          message =
            "Account cannot be empty."
        });
    }

    if (request.Amount.HasValue &&
        request.Amount.Value <= 0)
    {
      return BadRequest(
        new
        {
          message =
            "Income amount must be greater than 0."
        });
    }

    if (request.IncomeDate.HasValue &&
        request.IncomeDate.Value == default)
    {
      return BadRequest(
        new
        {
          message =
            "Income date is invalid."
        });
    }

    try
    {
      var updatedIncome =
        await _incomeService.PatchIncomeAsync(
          incomeId,
          request,
          userId);

      if (updatedIncome is null)
      {
        return NotFound(
          new
          {
            message =
              "Income record or account not found."
          });
      }

      return Ok(
        updatedIncome);
    }
    catch (ArgumentException exception)
    {
      return BadRequest(
        new
        {
          message =
            exception.Message
        });
    }
  }

  /*===========================================================
    DeleteIncome:
    => Deletes an existing income record.
    => Returns the deleted income record.

    DELETE /api/budget/income/{incomeId}
  ===========================================================*/
  [HttpDelete("income/{incomeId}")]
  public async Task<ActionResult<IncomeResponse>>
    DeleteIncome(
      string incomeId)
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(
        incomeId))
    {
      return BadRequest(
        new
        {
          message =
            "Income record ID is required."
        });
    }

    var deletedIncome =
      await _incomeService.DeleteIncomeAsync(
        incomeId,
        userId);

    if (deletedIncome is null)
    {
      return NotFound(
        new
        {
          message =
            "Income record not found."
        });
    }

    return Ok(
      deletedIncome);
  }
}