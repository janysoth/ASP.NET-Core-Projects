using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

// Marks this class as an API controller.
[ApiController]

// Base route for account transfer endpoints.
// Example:
// GET    /api/budget/transfers
// POST   /api/budget/transfers
// PATCH  /api/budget/transfers/{transferId}
// DELETE /api/budget/transfers/{transferId}
[Route("api/budget/transfers")]
public class TransfersController : BudgetControllerBase
{
  // Service responsible for account transfer business logic.
  private readonly TransferService _transferService;

  // Constructor used for Dependency Injection (DI).
  public TransfersController(
    TransferService transferService)
  {
    _transferService = transferService;
  }

  /*===========================================================
    GetTransfers:
    => GET: api/budget/transfers
    => Gets all account transfers for the logged-in user.
  ===========================================================*/
  [HttpGet]
  public async Task<ActionResult<List<AccountTransferResponse>>>
    GetTransfers()
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var transfers =
      await _transferService
        .GetTransfersAsync(
          userId);

    return Ok(
      transfers);
  }

  /*===========================================================
    CreateTransfer:
    => POST: api/budget/transfers
    => Creates a transfer between two accounts.

    Supported examples:

    Checking → Savings
    Savings  → Checking
    Checking → CreditCard
    Savings  → CreditCard

    IMPORTANT:
    => Transfers do not create expenses.
    => Transfers are not linked to bills.
  ===========================================================*/
  [HttpPost]
  public async Task<ActionResult<AccountTransferResponse>>
    CreateTransfer(
      CreateAccountTransferRequest request)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(
      request.FromAccountId))
    {
      return BadRequest(
        "Source account is required.");
    }

    if (string.IsNullOrWhiteSpace(
      request.ToAccountId))
    {
      return BadRequest(
        "Destination account is required.");
    }

    if (request.FromAccountId ==
        request.ToAccountId)
    {
      return BadRequest(
        "Source and destination accounts cannot be the same.");
    }

    if (request.Amount <= 0)
    {
      return BadRequest(
        "Transfer amount must be greater than 0.");
    }

    if (request.TransferDate == default)
    {
      return BadRequest(
        "Transfer date is required.");
    }

    var transfer =
      await _transferService
        .CreateTransferAsync(
          request,
          userId);

    if (transfer == null)
    {
      return BadRequest(
        "The transfer could not be created. Check the accounts, transfer date, amount, or credit-card balance.");
    }

    return Ok(
      transfer);
  }

  /*===========================================================
    PatchTransfer:
    => PATCH: api/budget/transfers/{transferId}
    => Partially updates an existing account transfer.
    => Only supplied fields are changed.
  ===========================================================*/
  [HttpPatch("{transferId}")]
  public async Task<ActionResult<AccountTransferResponse>>
    PatchTransfer(
      string transferId,
      PatchAccountTransferRequest request)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var updatedTransfer =
      await _transferService
        .PatchTransferAsync(
          transferId,
          request,
          userId);

    if (updatedTransfer == null)
    {
      return BadRequest(
        "The transfer could not be updated. Check the accounts, transfer date, amount, or credit-card balance.");
    }

    return Ok(
      updatedTransfer);
  }

  /*===========================================================
    DeleteTransfer:
    => DELETE: api/budget/transfers/{transferId}
    => Deletes an existing account transfer.
    => Account balances recalculate from the remaining data.
  ===========================================================*/
  [HttpDelete("{transferId}")]
  public async Task<ActionResult<AccountTransferResponse>>
    DeleteTransfer(
      string transferId)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var deletedTransfer =
      await _transferService
        .DeleteTransferAsync(
          transferId,
          userId);

    if (deletedTransfer == null)
    {
      return NotFound(
        "Transfer not found.");
    }

    return Ok(
      deletedTransfer);
  }
}