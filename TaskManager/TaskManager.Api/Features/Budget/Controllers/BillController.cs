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
    _billService = billService;
  }

  /*===========================================================
    GetBills:
    => Gets bills belonging to the logged-in user.
    => Supports optional month and year filters.
    => Bills represent Fixed Expense obligations only.
  ===========================================================*/
  [HttpGet("bills")]
  public async Task<ActionResult<List<BillResponse>>> GetBills(
    [FromQuery] int? month,
    [FromQuery] int? year)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (month.HasValue &&
        (month.Value < 1 ||
         month.Value > 12))
    {
      return BadRequest(
        "Month must be between 1 and 12.");
    }

    if (year.HasValue &&
        year.Value < 2000)
    {
      return BadRequest(
        "Year is invalid.");
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
  ===========================================================*/
  [HttpGet("bills/{billId}")]
  public async Task<ActionResult<BillResponse>> GetBillById(
    string billId)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var bill =
      await _billService.GetBillByIdAsync(
        billId,
        userId);

    if (bill == null)
    {
      return NotFound(
        "Bill not found.");
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
  ===========================================================*/
  [HttpPost("months/{budgetMonthId}/bills")]
  public async Task<ActionResult<BillResponse>> CreateBill(
    string budgetMonthId,
    CreateBillRequest request)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    /*---------------------------------------------------------
      Budget category is required.
    ---------------------------------------------------------*/
    if (string.IsNullOrWhiteSpace(
      request.BudgetCategoryId))
    {
      return BadRequest(
        "Budget category is required.");
    }

    /*---------------------------------------------------------
      Bill name is required.
    ---------------------------------------------------------*/
    if (string.IsNullOrWhiteSpace(
      request.Name))
    {
      return BadRequest(
        "Bill name is required.");
    }

    /*---------------------------------------------------------
      Expected amount must be positive.
    ---------------------------------------------------------*/
    if (request.ExpectedAmount <= 0)
    {
      return BadRequest(
        "Expected amount must be greater than 0.");
    }

    /*---------------------------------------------------------
      Due date is required.
    ---------------------------------------------------------*/
    if (request.DueDate == default)
    {
      return BadRequest(
        "Due date is required.");
    }

    try
    {
      var bill =
        await _billService.CreateBillAsync(
          budgetMonthId,
          request,
          userId);

      if (bill == null)
      {
        return BadRequest(
          "The bill could not be created. The category must be a valid Fixed Expense category belonging to the selected budget month.");
      }

      return CreatedAtAction(
        nameof(GetBillById),
        new
        {
          billId = bill.Id
        },
        bill);
    }
    catch (ArgumentException ex)
    {
      return BadRequest(
        ex.Message);
    }
  }

  /*===========================================================
    UpdateBill:
    => Updates an existing Fixed Expense bill.
    => Category must remain a valid Fixed Expense category.
    => Due date must remain within the bill's budget month.
  ===========================================================*/
  [HttpPut("bills/{billId}")]
  public async Task<ActionResult<BillResponse>> UpdateBill(
    string billId,
    UpdateBillRequest request)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    /*---------------------------------------------------------
      Budget category is required.
    ---------------------------------------------------------*/
    if (string.IsNullOrWhiteSpace(
      request.BudgetCategoryId))
    {
      return BadRequest(
        "Budget category is required.");
    }

    /*---------------------------------------------------------
      Bill name is required.
    ---------------------------------------------------------*/
    if (string.IsNullOrWhiteSpace(
      request.Name))
    {
      return BadRequest(
        "Bill name is required.");
    }

    /*---------------------------------------------------------
      Expected amount must be positive.
    ---------------------------------------------------------*/
    if (request.ExpectedAmount <= 0)
    {
      return BadRequest(
        "Expected amount must be greater than 0.");
    }

    /*---------------------------------------------------------
      Due date is required.
    ---------------------------------------------------------*/
    if (request.DueDate == default)
    {
      return BadRequest(
        "Due date is required.");
    }

    try
    {
      var updatedBill =
        await _billService.UpdateBillAsync(
          billId,
          request,
          userId);

      if (updatedBill == null)
      {
        return BadRequest(
          "The bill could not be updated. Check the category, bill values, or whether the bill exists.");
      }

      return Ok(
        updatedBill);
    }
    catch (ArgumentException ex)
    {
      return BadRequest(
        ex.Message);
    }
  }

  /*===========================================================
    DeleteBill:
    => Deletes one bill.
    => If the bill was paid, also deletes the linked
       ExpenseRecord created by that payment.
  ===========================================================*/
  [HttpDelete("bills/{billId}")]
  public async Task<ActionResult<BillResponse>> DeleteBill(
    string billId)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var deletedBill =
      await _billService.DeleteBillAsync(
        billId,
        userId);

    if (deletedBill == null)
    {
      return NotFound(
        "Bill not found.");
    }

    return Ok(
      deletedBill);
  }

  /*===========================================================
    MarkBillPaid:
    => Marks a Fixed Expense bill as paid.
    => Creates one ExpenseRecord.
    => Payment account may be Checking, Savings, or CreditCard.
    => Paid date cannot be in the future.
  ===========================================================*/
  [HttpPost("bills/{billId}/mark-paid")]
  public async Task<ActionResult<BillResponse>> MarkBillPaid(
    string billId,
    MarkBillPaidRequest request)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    /*---------------------------------------------------------
      Payment account is required.
    ---------------------------------------------------------*/
    if (string.IsNullOrWhiteSpace(
      request.AccountId))
    {
      return BadRequest(
        "Payment account is required.");
    }

    /*---------------------------------------------------------
      Actual amount must be positive.
    ---------------------------------------------------------*/
    if (request.ActualAmount <= 0)
    {
      return BadRequest(
        "Actual amount must be greater than 0.");
    }

    /*---------------------------------------------------------
      Paid date is required.
    ---------------------------------------------------------*/
    if (request.PaidDate == default)
    {
      return BadRequest(
        "Paid date is required.");
    }

    var paidBill =
      await _billService.MarkBillPaidAsync(
        billId,
        request,
        userId);

    if (paidBill == null)
    {
      return BadRequest(
        "The bill could not be paid. It may already be paid, the payment account may be invalid, the category may be invalid, or the paid date may be in the future.");
    }

    return Ok(
      paidBill);
  }

  /*===========================================================
    MarkBillUnpaid:
    => Reverses a bill payment.
    => Deletes the linked ExpenseRecord.
    => Restores category spending and account balance impact.
  ===========================================================*/
  [HttpPost("bills/{billId}/mark-unpaid")]
  public async Task<ActionResult<BillResponse>> MarkBillUnpaid(
    string billId)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var unpaidBill =
      await _billService.MarkBillUnpaidAsync(
        billId,
        userId);

    if (unpaidBill == null)
    {
      return BadRequest(
        "The bill could not be marked unpaid. It may already be unpaid, may not exist, or may not have a linked expense record.");
    }

    return Ok(
      unpaidBill);
  }
}