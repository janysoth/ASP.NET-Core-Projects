using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

[ApiController]
[Route("api/budget/accounts")]
public class AccountsController : BudgetControllerBase
{
  private readonly AccountService _accountService;

  public AccountsController(AccountService accountService)
  {
    _accountService = accountService;
  }

  [HttpGet]
  public async Task<ActionResult<List<FinancialAccountResponse>>> GetAccounts()
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var accounts = await _accountService.GetAccountsAsync(userId);

    return Ok(accounts);
  }

  [HttpPost]
  public async Task<ActionResult<FinancialAccountResponse>> CreateAccount(
    CreateFinancialAccountRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(request.Name))
    {
      return BadRequest("Account name is required.");
    }

    if (!IsValidAccountType(request.Type))
    {
      return BadRequest("Account type must be Checking, Savings, or CreditCard.");
    }

    var account = await _accountService.CreateAccountAsync(request, userId);

    return Ok(account);
  }

  [HttpPut("{accountId}")]
  public async Task<ActionResult<FinancialAccountResponse>> UpdateAccount(
    string accountId,
    UpdateFinancialAccountRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(request.Name))
    {
      return BadRequest("Account name is required.");
    }

    if (!IsValidAccountType(request.Type))
    {
      return BadRequest("Account type must be Checking, Savings, or CreditCard.");
    }

    var updatedAccount = await _accountService.UpdateAccountAsync(
      accountId,
      request,
      userId);

    if (updatedAccount == null)
    {
      return NotFound("Account not found.");
    }

    return Ok(updatedAccount);
  }

  [HttpDelete("{accountId}")]
  public async Task<ActionResult<FinancialAccountResponse>> DeleteAccount(
    string accountId)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var deletedAccount = await _accountService.DeleteAccountAsync(
      accountId,
      userId);

    if (deletedAccount == null)
    {
      return NotFound("Account not found.");
    }

    return Ok(deletedAccount);
  }
}