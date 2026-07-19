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

    return Ok(bills);
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
    var userId = GetUserId();

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

    return Ok(bill);
  }

  /*===========================================================
    CreateBill:
    => Creates an Expense bill or Transfer bill.
    => Expense bills require a budget category.
    => Transfer bills require a CreditCard destination account.
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

    if (!BillPaymentTypes.IsValid(
      request.PaymentType))
    {
      return BadRequest(
        "Payment type must be Expense or Transfer.");
    }

    if (string.IsNullOrWhiteSpace(
      request.Name))
    {
      return BadRequest(
        "Bill name is required.");
    }

    if (request.ExpectedAmount <= 0)
    {
      return BadRequest(
        "Expected amount must be greater than 0.");
    }

    if (request.DueDate == default)
    {
      return BadRequest(
        "Due date is required.");
    }

    /*
      Expense Bill validation.
    */
    if (string.Equals(
      request.PaymentType,
      BillPaymentTypes.Expense,
      StringComparison.OrdinalIgnoreCase))
    {
      if (string.IsNullOrWhiteSpace(
        request.BudgetCategoryId))
      {
        return BadRequest(
          "Budget category is required for an Expense bill.");
      }

      if (!string.IsNullOrWhiteSpace(
        request.DestinationAccountId))
      {
        return BadRequest(
          "Destination account must be empty for an Expense bill.");
      }
    }

    /*
      Transfer Bill validation.
    */
    if (string.Equals(
      request.PaymentType,
      BillPaymentTypes.Transfer,
      StringComparison.OrdinalIgnoreCase))
    {
      if (string.IsNullOrWhiteSpace(
        request.DestinationAccountId))
      {
        return BadRequest(
          "Destination CreditCard account is required for a Transfer bill.");
      }

      if (!string.IsNullOrWhiteSpace(
        request.BudgetCategoryId))
      {
        return BadRequest(
          "Budget category must be empty for a Transfer bill.");
      }
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
          "The bill could not be created. Expense bills must use a valid Expense category, and Transfer bills must use a valid CreditCard destination account.");
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
    => Updates an Expense or Transfer bill.
    => Validates the required relationship for its payment type.
    => Paid bills cannot switch payment types.
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

    if (!BillPaymentTypes.IsValid(
      request.PaymentType))
    {
      return BadRequest(
        "Payment type must be Expense or Transfer.");
    }

    if (string.IsNullOrWhiteSpace(
      request.Name))
    {
      return BadRequest(
        "Bill name is required.");
    }

    if (request.ExpectedAmount <= 0)
    {
      return BadRequest(
        "Expected amount must be greater than 0.");
    }

    if (request.DueDate == default)
    {
      return BadRequest(
        "Due date is required.");
    }

    if (string.Equals(
      request.PaymentType,
      BillPaymentTypes.Expense,
      StringComparison.OrdinalIgnoreCase))
    {
      if (string.IsNullOrWhiteSpace(
        request.BudgetCategoryId))
      {
        return BadRequest(
          "Budget category is required for an Expense bill.");
      }

      if (!string.IsNullOrWhiteSpace(
        request.DestinationAccountId))
      {
        return BadRequest(
          "Destination account must be empty for an Expense bill.");
      }
    }

    if (string.Equals(
      request.PaymentType,
      BillPaymentTypes.Transfer,
      StringComparison.OrdinalIgnoreCase))
    {
      if (string.IsNullOrWhiteSpace(
        request.DestinationAccountId))
      {
        return BadRequest(
          "Destination CreditCard account is required for a Transfer bill.");
      }

      if (!string.IsNullOrWhiteSpace(
        request.BudgetCategoryId))
      {
        return BadRequest(
          "Budget category must be empty for a Transfer bill.");
      }
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
          "The bill could not be updated. Check the payment type, category, destination account, or whether a paid bill is being changed.");
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
    => Also removes the ExpenseRecord or AccountTransfer
       automatically created when the bill was paid.
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
    => Pays an Expense bill or Transfer bill.
    => Expense bills create ExpenseRecords.
    => Transfer bills create AccountTransfers.
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

    if (string.IsNullOrWhiteSpace(
      request.AccountId))
    {
      return BadRequest(
        "Payment account is required.");
    }

    if (request.ActualAmount <= 0)
    {
      return BadRequest(
        "Actual amount must be greater than 0.");
    }

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
        "The bill could not be paid. It may already be paid, the payment account may be invalid, or a Transfer bill may require a Checking or Savings source account.");
    }

    return Ok(
      paidBill);
  }

  /*===========================================================
    MarkBillUnpaid:
    => Reverses the payment for a bill.
    => Deletes its linked ExpenseRecord or AccountTransfer.
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

    var unpaidBill =
      await _billService.MarkBillUnpaidAsync(
        billId,
        userId);

    if (unpaidBill == null)
    {
      return BadRequest(
        "The bill could not be marked unpaid. It may already be unpaid or may not exist.");
    }

    return Ok(
      unpaidBill);
  }
}