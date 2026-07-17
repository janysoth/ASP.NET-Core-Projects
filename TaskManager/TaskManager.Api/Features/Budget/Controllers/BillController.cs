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
    => Allows the controller to use bill business logic.
  ===========================================================*/
  public BillsController(BillService billService)
  {
    _billService = billService;
  }

  /*===========================================================
    Endpoints:
      GET    /api/budget/bills
      GET    /api/budget/bills/{billId}
      POST   /api/budget/months/{budgetMonthId}/bills
      PUT    /api/budget/bills/{billId}
      DELETE /api/budget/bills/{billId}
      POST   /api/budget/bills/{billId}/mark-paid
      POST   /api/budget/bills/{billId}/mark-unpaid
  ===========================================================*/


  /*===========================================================
    GetBills:
    => Gets all bills belonging to the logged-in user.
    => Supports optional month and year filters.
    => Returns bills sorted by due date.
  ===========================================================*/
  [HttpGet("bills")]
  public async Task<ActionResult<List<BillResponse>>> GetBills(
    [FromQuery] int? month,
    [FromQuery] int? year)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (month.HasValue &&
        (month.Value < 1 || month.Value > 12))
    {
      return BadRequest("Month must be between 1 and 12.");
    }

    if (year.HasValue && year.Value < 2000)
    {
      return BadRequest("Year is invalid.");
    }

    var bills = await _billService.GetBillsAsync(
      userId,
      month,
      year);

    return Ok(bills);
  }

  /*===========================================================
    GetBillById:
    => Gets one bill by its ID.
    => Ensures the bill belongs to the logged-in user.
    => Returns 404 when the bill does not exist.
  ===========================================================*/
  [HttpGet("bills/{billId}")]
  public async Task<ActionResult<BillResponse>> GetBillById(
    string billId)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var bill = await _billService.GetBillByIdAsync(
      billId,
      userId);

    if (bill == null)
    {
      return NotFound("Bill not found.");
    }

    return Ok(bill);
  }

  /*===========================================================
    CreateBill:
    => Creates a bill inside a budget month.
    => Validates category, name, amount, and due date.
    => Does not create an expense until the bill is paid.
  ===========================================================*/
  [HttpPost("months/{budgetMonthId}/bills")]
  public async Task<ActionResult<BillResponse>> CreateBill(
    string budgetMonthId,
    CreateBillRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(request.BudgetCategoryId))
    {
      return BadRequest("Budget category is required.");
    }

    if (string.IsNullOrWhiteSpace(request.Name))
    {
      return BadRequest("Bill name is required.");
    }

    if (request.ExpectedAmount <= 0)
    {
      return BadRequest("Expected amount must be greater than 0.");
    }

    if (request.DueDate == default)
    {
      return BadRequest("Due date is required.");
    }

    try
    {
      var bill = await _billService.CreateBillAsync(
        budgetMonthId,
        request,
        userId);

      if (bill == null)
      {
        return BadRequest(
          "The bill must use an Expense category from the selected budget month. Savings categories cannot be linked to bills.");
      }

      return CreatedAtAction(
        nameof(GetBillById),
        new { billId = bill.Id },
        bill);
    }
    catch (ArgumentException ex)
    {
      return BadRequest(ex.Message);
    }
  }

  /*===========================================================
    UpdateBill:
    => Updates the bill's details.
    => Keeps a linked paid expense synchronized.
    => Returns the updated bill.
  ===========================================================*/
  [HttpPut("bills/{billId}")]
  public async Task<ActionResult<BillResponse>> UpdateBill(
  string billId,
  UpdateBillRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(request.BudgetCategoryId))
    {
      return BadRequest("Budget category is required.");
    }

    if (string.IsNullOrWhiteSpace(request.Name))
    {
      return BadRequest("Bill name is required.");
    }

    if (request.ExpectedAmount <= 0)
    {
      return BadRequest("Expected amount must be greater than 0.");
    }

    if (request.DueDate == default)
    {
      return BadRequest("Due date is required.");
    }

    try
    {
      var updatedBill = await _billService.UpdateBillAsync(
        billId,
        request,
        userId);

      if (updatedBill == null)
      {
        return BadRequest(
          "The bill must use an Expense category from the selected budget month. Savings categories cannot be linked to bills.");
      }

      return Ok(updatedBill);
    }
    catch (ArgumentException ex)
    {
      return BadRequest(ex.Message);
    }
  }

  /*===========================================================
    DeleteBill:
    => Deletes one bill owned by the logged-in user.
    => Also removes the expense created by that bill.
    => Returns the deleted bill information.
  ===========================================================*/
  [HttpDelete("bills/{billId}")]
  public async Task<ActionResult<BillResponse>> DeleteBill(
    string billId)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var deletedBill = await _billService.DeleteBillAsync(
      billId,
      userId);

    if (deletedBill == null)
    {
      return NotFound("Bill not found.");
    }

    return Ok(deletedBill);
  }

  /*===========================================================
    MarkBillPaid:
    => Marks an unpaid bill as paid.
    => Creates an expense from the selected account.
    => Returns the updated bill with payment details.
  ===========================================================*/
  [HttpPost("bills/{billId}/mark-paid")]
  public async Task<ActionResult<BillResponse>> MarkBillPaid(
    string billId,
    MarkBillPaidRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(request.AccountId))
    {
      return BadRequest("Payment account is required.");
    }

    if (request.ActualAmount <= 0)
    {
      return BadRequest(
        "Actual amount must be greater than 0.");
    }

    if (request.PaidDate == default)
    {
      return BadRequest("Paid date is required.");
    }

    var paidBill = await _billService.MarkBillPaidAsync(
      billId,
      request,
      userId);

    if (paidBill == null)
    {
      return BadRequest(
        "The bill could not be paid. It may already be paid, or its account/category may be invalid.");
    }

    return Ok(paidBill);
  }

  /*===========================================================
    MarkBillUnpaid:
    => Changes a paid bill back to unpaid.
    => Removes the expense created when the bill was marked paid.
    => Returns the updated unpaid bill.
  ===========================================================*/
  [HttpPost("bills/{billId}/mark-unpaid")]
  public async Task<ActionResult<BillResponse>> MarkBillUnpaid(
    string billId)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var unpaidBill = await _billService.MarkBillUnpaidAsync(
      billId,
      userId);

    if (unpaidBill == null)
    {
      return BadRequest(
        "The bill could not be marked unpaid. It may already be unpaid or may not exist.");
    }

    return Ok(unpaidBill);
  }
}