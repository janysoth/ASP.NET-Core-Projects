using Microsoft.AspNetCore.Mvc;
// using TaskManager.Api.Features.Budget.DTOs;
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
  // Service responsible for account transfer business logic
  private readonly TransferService _transferService;

  // Constructor used for Dependency Injection (DI)
  public TransfersController(TransferService transferService)
  {
    _transferService = transferService;
  }

  // ==========================================
  // GET: api/budget/transfers
  // Gets all account transfers for the
  // logged-in user.
  // ==========================================
  [HttpGet]
  public async Task<ActionResult<List<AccountTransferResponse>>> GetTransfers()
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Get all transfers that belong to this user
    var transfers = await _transferService.GetTransfersAsync(userId);

    // Return the transfer list
    return Ok(transfers);
  }

  /*===========================================================
   CreateTransfer:
   => POST: api/budget/transfers
   => Creates a transfer between two accounts.
   => Supports direct credit-card payments.
   => BillId is optional for linking a payment to a Transfer bill.
 ===========================================================*/
  [HttpPost]
  public async Task<ActionResult<AccountTransferResponse>>
    CreateTransfer(
      CreateAccountTransferRequest request)
  {
    var userId = GetUserId();

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
      await _transferService.CreateTransferAsync(
        request,
        userId);

    if (transfer == null)
    {
      return BadRequest(
        "The transfer could not be created. Check the accounts, credit-card balance, payment amount, or linked bill.");
    }

    return Ok(transfer);
  }

  // ==========================================
  // PATCH: api/budget/transfers/{transferId}
  // Partially updates an existing account
  // transfer. Only the fields included in
  // the request will be updated.
  // ==========================================
  [HttpPatch("{transferId}")]
  public async Task<ActionResult<AccountTransferResponse>> PatchTransfer(
    string transferId,
    PatchAccountTransferRequest request)
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Validate the source account if it was supplied
    if (request.FromAccountId != null &&
        string.IsNullOrWhiteSpace(request.FromAccountId))
    {
      return BadRequest("From account cannot be empty.");
    }

    // Validate the destination account if it was supplied
    if (request.ToAccountId != null &&
        string.IsNullOrWhiteSpace(request.ToAccountId))
    {
      return BadRequest("To account cannot be empty.");
    }

    // Validate the transfer amount if it was supplied
    if (request.Amount.HasValue && request.Amount.Value <= 0)
    {
      return BadRequest("Transfer amount must be greater than 0.");
    }

    // Update only the supplied fields
    var updatedTransfer = await _transferService.PatchTransferAsync(
      transferId,
      request,
      userId);

    // Return 404 if the transfer or account was not found
    if (updatedTransfer == null)
    {
      return NotFound("Transfer or account not found.");
    }

    // Return the updated transfer
    return Ok(updatedTransfer);
  }

  // ==========================================
  // DELETE: api/budget/transfers/{transferId}
  // Deletes an existing account transfer.
  // ==========================================
  [HttpDelete("{transferId}")]
  public async Task<ActionResult<AccountTransferResponse>> DeleteTransfer(
    string transferId)
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Delete the selected transfer
    var deletedTransfer = await _transferService.DeleteTransferAsync(
      transferId,
      userId);

    // Return 404 if the transfer does not exist
    // or does not belong to the current user
    if (deletedTransfer == null)
    {
      return NotFound("Transfer not found.");
    }

    // Return the deleted transfer
    return Ok(deletedTransfer);
  }
}