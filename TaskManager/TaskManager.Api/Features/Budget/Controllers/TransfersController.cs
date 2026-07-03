using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

[ApiController]
[Route("api/budget/transfers")]
public class TransfersController : BudgetControllerBase
{
  private readonly TransferService _transferService;

  public TransfersController(TransferService transferService)
  {
    _transferService = transferService;
  }

  [HttpGet]
  public async Task<ActionResult<List<AccountTransferResponse>>> GetTransfers()
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var transfers = await _transferService.GetTransfersAsync(userId);

    return Ok(transfers);
  }

  [HttpPost]
  public async Task<ActionResult<AccountTransferResponse>> CreateTransfer(
    CreateAccountTransferRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(request.FromAccountId))
    {
      return BadRequest("From account is required.");
    }

    if (string.IsNullOrWhiteSpace(request.ToAccountId))
    {
      return BadRequest("To account is required.");
    }

    if (request.FromAccountId == request.ToAccountId)
    {
      return BadRequest("From account and to account cannot be the same.");
    }

    if (request.Amount <= 0)
    {
      return BadRequest("Transfer amount must be greater than 0.");
    }

    var transfer = await _transferService.CreateTransferAsync(request, userId);

    if (transfer == null)
    {
      return NotFound("One or both accounts were not found.");
    }

    return Ok(transfer);
  }

  [HttpPatch("{transferId}")]
  public async Task<ActionResult<AccountTransferResponse>> PatchTransfer(
    string transferId,
    PatchAccountTransferRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (request.FromAccountId != null && string.IsNullOrWhiteSpace(request.FromAccountId))
    {
      return BadRequest("From account cannot be empty.");
    }

    if (request.ToAccountId != null && string.IsNullOrWhiteSpace(request.ToAccountId))
    {
      return BadRequest("To account cannot be empty.");
    }

    if (request.Amount.HasValue && request.Amount.Value <= 0)
    {
      return BadRequest("Transfer amount must be greater than 0.");
    }

    var updatedTransfer = await _transferService.PatchTransferAsync(
      transferId,
      request,
      userId);

    if (updatedTransfer == null)
    {
      return NotFound("Transfer or account not found.");
    }

    return Ok(updatedTransfer);
  }

  [HttpDelete("{transferId}")]
  public async Task<ActionResult<AccountTransferResponse>> DeleteTransfer(
    string transferId)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var deletedTransfer = await _transferService.DeleteTransferAsync(
      transferId,
      userId);

    if (deletedTransfer == null)
    {
      return NotFound("Transfer not found.");
    }

    return Ok(deletedTransfer);
  }
}