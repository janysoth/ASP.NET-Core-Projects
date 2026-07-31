using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

// Marks this class as an API controller.
[ApiController]

/*===========================================================
  Base route for income endpoints.

  Examples:

  POST: /api/budget/months/{budgetMonthId}/income

  PUT: /api/budget/income/{incomeId}

  PATCH: /api/budget/income/{incomeId}

  DELETE: /api/budget/income/{incomeId}
=============================================================*/

[Route("api/budget")]
public class IncomeController : BudgetControllerBase
{
  // Service responsible for income business logic.
  private readonly IncomeService _incomeService;

  /*===========================================================
    IncomeController Constructor
  ===========================================================*/
  public IncomeController(
    IncomeService incomeService)
  {
    _incomeService = incomeService;
  }

  /*===========================================================
    POST: api/budget/months/{budgetMonthId}/income

    Adds a new income record to a selected budget month.

    Returns:
    - 200 OK when the income is created.
    - 400 Bad Request when validation fails.
    - 401 Unauthorized when the user is not authenticated.
    - 404 Not Found when the budget month or account
      cannot be found.
  ===========================================================*/
  [HttpPost("months/{budgetMonthId}/income")]
  public async Task<ActionResult<IncomeResponse>> AddIncome(
    string budgetMonthId,
    CreateIncomeRequest request)
  {
    /*---------------------------------------------------------
      Get the authenticated user's ID
    ---------------------------------------------------------*/
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    /*---------------------------------------------------------
      Validate required account
    ---------------------------------------------------------*/
    if (string.IsNullOrWhiteSpace(
        request.AccountId))
    {
      return BadRequest(
        new
        {
          message = "Account is required."
        });
    }

    /*---------------------------------------------------------
      Validate required income source
    ---------------------------------------------------------*/
    if (string.IsNullOrWhiteSpace(
        request.Source))
    {
      return BadRequest(
        new
        {
          message = "Income source is required."
        });
    }

    /*---------------------------------------------------------
      Validate income amount
    ---------------------------------------------------------*/
    if (request.Amount <= 0)
    {
      return BadRequest(
        new
        {
          message =
            "Income amount must be greater than 0."
        });
    }

    try
    {
      /*-------------------------------------------------------
        Create the income record

        The service also validates:

        - The income date belongs to the budget month.
        - Income is not deposited into a credit card.
        - The account belongs to the current user.
      -------------------------------------------------------*/
      var income =
        await _incomeService.AddIncomeAsync(
          budgetMonthId,
          request,
          userId);

      /*-------------------------------------------------------
        Return 404 when the budget month or account
        cannot be found
      -------------------------------------------------------*/
      if (income == null)
      {
        return NotFound(
          new
          {
            message =
              "Budget month or account not found."
          });
      }

      /*-------------------------------------------------------
        Return the newly created income record
      -------------------------------------------------------*/
      return Ok(
        income);
    }
    catch (ArgumentException exception)
    {
      /*-------------------------------------------------------
        Return business-rule validation errors as 400

        Examples:

        - Income date is outside the budget month.
        - Income account is a credit card.
        - Amount is invalid.
      -------------------------------------------------------*/
      return BadRequest(
        new
        {
          message = exception.Message
        });
    }
  }

  /*===========================================================
    PUT: api/budget/income/{incomeId}

    Completely updates an existing income record.

    The updated income date must remain inside the income
    record's original budget month.
  ===========================================================*/
  [HttpPut("income/{incomeId}")]
  public async Task<ActionResult<IncomeResponse>> UpdateIncome(
    string incomeId,
    UpdateIncomeRequest request)
  {
    /*---------------------------------------------------------
      Get the authenticated user's ID
    ---------------------------------------------------------*/
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    /*---------------------------------------------------------
      Validate required account
    ---------------------------------------------------------*/
    if (string.IsNullOrWhiteSpace(
        request.AccountId))
    {
      return BadRequest(
        new
        {
          message = "Account is required."
        });
    }

    /*---------------------------------------------------------
      Validate required income source
    ---------------------------------------------------------*/
    if (string.IsNullOrWhiteSpace(
        request.Source))
    {
      return BadRequest(
        new
        {
          message = "Income source is required."
        });
    }

    /*---------------------------------------------------------
      Validate income amount
    ---------------------------------------------------------*/
    if (request.Amount <= 0)
    {
      return BadRequest(
        new
        {
          message =
            "Income amount must be greater than 0."
        });
    }

    try
    {
      /*-------------------------------------------------------
        Update the income record

        The service validates that the new income date still
        belongs to the income record's budget month.
      -------------------------------------------------------*/
      var updatedIncome =
        await _incomeService.UpdateIncomeAsync(
          incomeId,
          request,
          userId);

      /*-------------------------------------------------------
        Return 404 when the income or account is not found
      -------------------------------------------------------*/
      if (updatedIncome == null)
      {
        return NotFound(
          new
          {
            message =
              "Income record or account not found."
          });
      }

      /*-------------------------------------------------------
        Return the updated income record
      -------------------------------------------------------*/
      return Ok(
        updatedIncome);
    }
    catch (ArgumentException exception)
    {
      /*-------------------------------------------------------
        Return business-rule validation errors as 400
      -------------------------------------------------------*/
      return BadRequest(
        new
        {
          message = exception.Message
        });
    }
  }

  /*===========================================================
    PATCH: api/budget/income/{incomeId}

    Partially updates an existing income record.

    Only the fields included in the request are updated.

    When IncomeDate is supplied, it must remain inside the
    income record's original budget month.
  ===========================================================*/
  [HttpPatch("income/{incomeId}")]
  public async Task<ActionResult<IncomeResponse>> PatchIncome(
    string incomeId,
    PatchIncomeRequest request)
  {
    /*---------------------------------------------------------
      Get the authenticated user's ID
    ---------------------------------------------------------*/
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    /*---------------------------------------------------------
      Validate income source when supplied
    ---------------------------------------------------------*/
    if (request.Source != null &&
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

    /*---------------------------------------------------------
      Validate account when supplied
    ---------------------------------------------------------*/
    if (request.AccountId != null &&
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

    /*---------------------------------------------------------
      Validate income amount when supplied
    ---------------------------------------------------------*/
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

    try
    {
      /*-------------------------------------------------------
        Update only the supplied fields

        The service validates the account, amount, source,
        account type, and income date.
      -------------------------------------------------------*/
      var updatedIncome =
        await _incomeService.PatchIncomeAsync(
          incomeId,
          request,
          userId);

      /*-------------------------------------------------------
        Return 404 when the income or account is not found
      -------------------------------------------------------*/
      if (updatedIncome == null)
      {
        return NotFound(
          new
          {
            message =
              "Income record or account not found."
          });
      }

      /*-------------------------------------------------------
        Return the updated income record
      -------------------------------------------------------*/
      return Ok(
        updatedIncome);
    }
    catch (ArgumentException exception)
    {
      /*-------------------------------------------------------
        Return business-rule validation errors as 400
      -------------------------------------------------------*/
      return BadRequest(
        new
        {
          message = exception.Message
        });
    }
  }

  /*===========================================================
    DELETE: api/budget/income/{incomeId}

    Deletes an existing income record.
  ===========================================================*/
  [HttpDelete("income/{incomeId}")]
  public async Task<ActionResult<IncomeResponse>> DeleteIncome(
    string incomeId)
  {
    /*---------------------------------------------------------
      Get the authenticated user's ID
    ---------------------------------------------------------*/
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    /*---------------------------------------------------------
      Delete the selected income record
    ---------------------------------------------------------*/
    var deletedIncome =
      await _incomeService.DeleteIncomeAsync(
        incomeId,
        userId);

    /*---------------------------------------------------------
      Return 404 when the income record does not exist
      or does not belong to the current user
    ---------------------------------------------------------*/
    if (deletedIncome == null)
    {
      return NotFound(
        new
        {
          message =
            "Income record not found."
        });
    }

    /*---------------------------------------------------------
      Return the deleted income record
    ---------------------------------------------------------*/
    return Ok(
      deletedIncome);
  }
}