using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

[ApiController]
[Route("api/budget")]
public class BillsController : BudgetControllerBase
{
  private readonly BillService _billService;

  /*===========================================================
    BillsController Constructor:
    => Receives BillService through dependency injection.
  ===========================================================*/
  public BillsController(
    BillService billService)
  {
    _billService =
      billService;
  }

  /*===========================================================
    GetBills:
    => Gets bills belonging to the logged-in user.
    => Supports optional month and year filters.
    => Bills represent Fixed Expense obligations only.

    GET /api/budget/bills
  ===========================================================*/
  [HttpGet("bills")]
  public async Task<ActionResult<List<BillResponse>>>
    GetBills(
      [FromQuery] int? month,
      [FromQuery] int? year)
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (month.HasValue &&
        (month.Value < 1 ||
         month.Value > 12))
    {
      return BadRequest(
        new
        {
          message =
            "Month must be between 1 and 12."
        });
    }

    if (year.HasValue &&
        year.Value < 2000)
    {
      return BadRequest(
        new
        {
          message =
            "Year is invalid."
        });
    }

    var bills =
      await _billService.GetBillsAsync(
        userId,
        month,
        year);

    return Ok(
      bills);
  }

  /*===========================================================
    GetBillById:
    => Gets one bill by ID.
    => Returns 404 when the bill does not exist.

    GET /api/budget/bills/{billId}
  ===========================================================*/
  [HttpGet("bills/{billId}")]
  public async Task<ActionResult<BillResponse>>
    GetBillById(
      string billId)
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(
        billId))
    {
      return BadRequest(
        new
        {
          message =
            "Bill ID is required."
        });
    }

    var bill =
      await _billService.GetBillByIdAsync(
        billId,
        userId);

    if (bill is null)
    {
      return NotFound(
        new
        {
          message =
            "Bill not found."
        });
    }

    return Ok(
      bill);
  }

  /*===========================================================
    CreateBill:
    => Creates a Fixed Expense bill.
    => Every bill must use a valid Fixed Expense category.
    => Bill.ExpectedAmount becomes part of the monthly
       Fixed planned budget.

    POST /api/budget/months/{budgetMonthId}/bills
  ===========================================================*/
  [HttpPost("months/{budgetMonthId}/bills")]
  public async Task<ActionResult<BillResponse>>
    CreateBill(
      string budgetMonthId,
      CreateBillRequest request)
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
        request.BudgetCategoryId))
    {
      return BadRequest(
        new
        {
          message =
            "Budget category is required."
        });
    }

    if (string.IsNullOrWhiteSpace(
        request.Name))
    {
      return BadRequest(
        new
        {
          message =
            "Bill name is required."
        });
    }

    if (request.ExpectedAmount <= 0)
    {
      return BadRequest(
        new
        {
          message =
            "Expected amount must be greater than 0."
        });
    }

    if (request.DueDate == default)
    {
      return BadRequest(
        new
        {
          message =
            "Due date is required."
        });
    }

    try
    {
      var bill =
        await _billService.CreateBillAsync(
          budgetMonthId,
          request,
          userId);

      if (bill is null)
      {
        return BadRequest(
          new
          {
            message =
              "The bill could not be created. The category must be a valid Fixed Expense category belonging to the selected budget month."
          });
      }

      return CreatedAtAction(
        nameof(GetBillById),
        new
        {
          billId =
            bill.Id
        },
        bill);
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
    UpdateBill:
    => Updates an existing Fixed Expense bill.
    => Category must remain a valid Fixed Expense category.
    => Due date must remain within the bill's budget month.
    => Paid bills cannot be updated.

    PUT /api/budget/bills/{billId}
  ===========================================================*/
  [HttpPut("bills/{billId}")]
  public async Task<ActionResult<BillResponse>>
    UpdateBill(
      string billId,
      UpdateBillRequest request)
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(
        billId))
    {
      return BadRequest(
        new
        {
          message =
            "Bill ID is required."
        });
    }

    if (string.IsNullOrWhiteSpace(
        request.BudgetCategoryId))
    {
      return BadRequest(
        new
        {
          message =
            "Budget category is required."
        });
    }

    if (string.IsNullOrWhiteSpace(
        request.Name))
    {
      return BadRequest(
        new
        {
          message =
            "Bill name is required."
        });
    }

    if (request.ExpectedAmount <= 0)
    {
      return BadRequest(
        new
        {
          message =
            "Expected amount must be greater than 0."
        });
    }

    if (request.DueDate == default)
    {
      return BadRequest(
        new
        {
          message =
            "Due date is required."
        });
    }

    try
    {
      var updatedBill =
        await _billService.UpdateBillAsync(
          billId,
          request,
          userId);

      if (updatedBill is null)
      {
        return NotFound(
          new
          {
            message =
              "Bill not found or could not be updated."
          });
      }

      return Ok(
        updatedBill);
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
    catch (InvalidOperationException exception)
    {
      return Conflict(
        new
        {
          message =
            exception.Message
        });
    }
  }

  /*===========================================================
    DeleteBill:
    => Deletes an unpaid bill.
    => Returns the deleted bill.
    => Returns 404 when the bill cannot be found.
    => Returns 409 when the bill has already been paid.

    DELETE /api/budget/bills/{billId}
  ===========================================================*/
  [HttpDelete("bills/{billId}")]
  public async Task<ActionResult<BillResponse>>
    DeleteBill(
      string billId)
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(
        billId))
    {
      return BadRequest(
        new
        {
          message =
            "Bill ID is required."
        });
    }

    try
    {
      var deletedBill =
        await _billService.DeleteBillAsync(
          billId,
          userId);

      if (deletedBill is null)
      {
        return NotFound(
          new
          {
            message =
              "Bill not found."
          });
      }

      return Ok(
        deletedBill);
    }
    catch (InvalidOperationException exception)
    {
      return Conflict(
        new
        {
          message =
            exception.Message
        });
    }
  }

  /*===========================================================
    MarkBillPaid:
    => Marks a Fixed Expense bill as paid.
    => Creates an ExpenseRecord inside the budget month that
       contains PaidDate.
    => Overdue bills may be paid during a later month.
  ===========================================================*/
  [HttpPost("bills/{billId}/mark-paid")]
  public async Task<ActionResult<BillResponse>>
    MarkBillPaid(
      string billId,
      MarkBillPaidRequest request)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(
      billId))
    {
      return BadRequest(new
      {
        message =
          "Bill ID is required."
      });
    }

    if (string.IsNullOrWhiteSpace(
      request.AccountId))
    {
      return BadRequest(new
      {
        message =
          "Payment account is required."
      });
    }

    if (request.ActualAmount <= 0)
    {
      return BadRequest(new
      {
        message =
          "Actual amount must be greater than 0."
      });
    }

    if (request.PaidDate == default)
    {
      return BadRequest(new
      {
        message =
          "Paid date is required."
      });
    }

    try
    {
      var paidBill =
        await _billService.MarkBillPaidAsync(
          billId,
          request,
          userId);

      if (paidBill == null)
      {
        return NotFound(new
        {
          message =
            "Bill was not found."
        });
      }

      return Ok(
        paidBill);
    }
    catch (ArgumentException exception)
    {
      return BadRequest(new
      {
        message =
          exception.Message
      });
    }
    catch (InvalidOperationException exception)
    {
      return Conflict(new
      {
        message =
          exception.Message
      });
    }
  }
  /*===========================================================
    MarkBillUnpaid:
    => Reverses a bill payment.
    => Deletes the linked ExpenseRecord.
    => Restores category spending and account balance impact.

    POST /api/budget/bills/{billId}/mark-unpaid
  ===========================================================*/
  [HttpPost("bills/{billId}/mark-unpaid")]
  public async Task<ActionResult<BillResponse>>
    MarkBillUnpaid(
      string billId)
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(
        billId))
    {
      return BadRequest(
        new
        {
          message =
            "Bill ID is required."
        });
    }

    var unpaidBill =
      await _billService.MarkBillUnpaidAsync(
        billId,
        userId);

    if (unpaidBill is null)
    {
      return BadRequest(
        new
        {
          message =
            "The bill could not be marked unpaid. It may already be unpaid, may not exist, or may not have a linked expense record."
        });
    }

    return Ok(
      unpaidBill);
  }
}