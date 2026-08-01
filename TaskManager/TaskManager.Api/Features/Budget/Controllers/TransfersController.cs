using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

// Marks this class as an API controller.
[ApiController]

// Base route for account transfer endpoints.
//
// Examples:
//
// GET:
// /api/budget/transfers
//
// POST:
// /api/budget/transfers
//
// PATCH:
// /api/budget/transfers/{transferId}
//
// DELETE:
// /api/budget/transfers/{transferId}
[Route("api/budget/transfers")]
public class TransfersController : BudgetControllerBase
{
  // Service responsible for account transfer business logic.
  private readonly TransferService _transferService;

  /*===========================================================
    TransfersController Constructor
  ===========================================================*/
  public TransfersController(
    TransferService transferService)
  {
    _transferService =
      transferService;
  }

  /*===========================================================
    GetTransfers:
    => Gets all account transfers belonging to the
       logged-in user.

    GET /api/budget/transfers
  ===========================================================*/
  [HttpGet]
  public async Task<ActionResult<List<AccountTransferResponse>>>
    GetTransfers()
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    var transfers =
      await _transferService.GetTransfersAsync(
        userId);

    return Ok(
      transfers);
  }

  /*===========================================================
    CreateTransfer:
    => Creates a transfer between two financial accounts.

    Supported examples:

    Checking -> Savings
    Savings  -> Checking
    Checking -> CreditCard
    Savings  -> CreditCard

    Important:

    => Transfers do not create expenses.
    => Transfers are not linked to bills.
    => Source and destination accounts must be different.
    => Future transfer dates are not allowed.

    POST /api/budget/transfers
  ===========================================================*/
  [HttpPost]
  public async Task<ActionResult<AccountTransferResponse>>
    CreateTransfer(
      CreateAccountTransferRequest request)
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(
        request.FromAccountId))
    {
      return BadRequest(
        new
        {
          message =
            "Source account is required."
        });
    }

    if (string.IsNullOrWhiteSpace(
        request.ToAccountId))
    {
      return BadRequest(
        new
        {
          message =
            "Destination account is required."
        });
    }

    if (string.Equals(
        request.FromAccountId,
        request.ToAccountId,
        StringComparison.Ordinal))
    {
      return BadRequest(
        new
        {
          message =
            "Source and destination accounts cannot be the same."
        });
    }

    if (request.Amount <= 0)
    {
      return BadRequest(
        new
        {
          message =
            "Transfer amount must be greater than 0."
        });
    }

    if (request.TransferDate == default)
    {
      return BadRequest(
        new
        {
          message =
            "Transfer date is required."
        });
    }

    var transfer =
      await _transferService.CreateTransferAsync(
        request,
        userId);

    if (transfer is null)
    {
      return BadRequest(
        new
        {
          message =
            "The transfer could not be created. Check the accounts, transfer date, amount, or credit-card balance."
        });
    }

    return Ok(
      transfer);
  }

  /*===========================================================
    PatchTransfer:
    => Partially updates an existing account transfer.
    => Only supplied fields are changed.

    PATCH /api/budget/transfers/{transferId}
  ===========================================================*/
  [HttpPatch("{transferId}")]
  public async Task<ActionResult<AccountTransferResponse>>
    PatchTransfer(
      string transferId,
      PatchAccountTransferRequest request)
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(
        transferId))
    {
      return BadRequest(
        new
        {
          message =
            "Transfer ID is required."
        });
    }

    if (request.FromAccountId is not null &&
        string.IsNullOrWhiteSpace(
          request.FromAccountId))
    {
      return BadRequest(
        new
        {
          message =
            "Source account cannot be empty."
        });
    }

    if (request.ToAccountId is not null &&
        string.IsNullOrWhiteSpace(
          request.ToAccountId))
    {
      return BadRequest(
        new
        {
          message =
            "Destination account cannot be empty."
        });
    }

    if (request.FromAccountId is not null &&
        request.ToAccountId is not null &&
        string.Equals(
          request.FromAccountId,
          request.ToAccountId,
          StringComparison.Ordinal))
    {
      return BadRequest(
        new
        {
          message =
            "Source and destination accounts cannot be the same."
        });
    }

    if (request.Amount.HasValue &&
        request.Amount.Value <= 0)
    {
      return BadRequest(
        new
        {
          message =
            "Transfer amount must be greater than 0."
        });
    }

    if (request.TransferDate.HasValue &&
        request.TransferDate.Value == default)
    {
      return BadRequest(
        new
        {
          message =
            "Transfer date is invalid."
        });
    }

    var updatedTransfer =
      await _transferService.PatchTransferAsync(
        transferId,
        request,
        userId);

    if (updatedTransfer is null)
    {
      return BadRequest(
        new
        {
          message =
            "The transfer could not be updated. Check the accounts, transfer date, amount, or credit-card balance."
        });
    }

    return Ok(
      updatedTransfer);
  }

  /*===========================================================
    DeleteTransfer:
    => Deletes an existing account transfer.
    => Account balances recalculate from the remaining data.

    DELETE /api/budget/transfers/{transferId}
  ===========================================================*/
  [HttpDelete("{transferId}")]
  public async Task<ActionResult<AccountTransferResponse>>
    DeleteTransfer(
      string transferId)
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(
        transferId))
    {
      return BadRequest(
        new
        {
          message =
            "Transfer ID is required."
        });
    }

    var deletedTransfer =
      await _transferService.DeleteTransferAsync(
        transferId,
        userId);

    if (deletedTransfer is null)
    {
      return NotFound(
        new
        {
          message =
            "Transfer not found."
        });
    }

    return Ok(
      deletedTransfer);
  }
}