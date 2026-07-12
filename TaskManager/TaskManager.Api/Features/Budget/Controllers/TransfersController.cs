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

  // ==========================================
  // POST: api/budget/transfers
  // Creates a new transfer between two accounts.
  // ==========================================
  [HttpPost]
  public async Task<ActionResult<AccountTransferResponse>> CreateTransfer(
    CreateAccountTransferRequest request)
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Validate that a source account was selected
    if (string.IsNullOrWhiteSpace(request.FromAccountId))
    {
      return BadRequest("From account is required.");
    }

    // Validate that a destination account was selected
    if (string.IsNullOrWhiteSpace(request.ToAccountId))
    {
      return BadRequest("To account is required.");
    }

    // Prevent transferring money to the same account
    if (request.FromAccountId == request.ToAccountId)
    {
      return BadRequest("From account and to account cannot be the same.");
    }

    // Validate that the transfer amount is greater than zero
    if (request.Amount <= 0)
    {
      return BadRequest("Transfer amount must be greater than 0.");
    }

    // Create the account transfer
    var transfer = await _transferService.CreateTransferAsync(request, userId);

    // Return 404 if one or both accounts were not found
    if (transfer == null)
    {
      return NotFound("One or both accounts were not found.");
    }

    // Return the newly created transfer
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