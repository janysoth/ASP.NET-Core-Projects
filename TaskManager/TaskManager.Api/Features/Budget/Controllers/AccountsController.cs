using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

// Marks this class as an API controller.
// Enables automatic model binding and validation.
[ApiController]

// Base route for all account endpoints.
//
// Examples:
//
// GET:
// /api/budget/accounts
//
// POST:
// /api/budget/accounts
//
// PUT:
// /api/budget/accounts/{accountId}
//
// DELETE:
// /api/budget/accounts/{accountId}
[Route("api/budget/accounts")]
public class AccountsController : BudgetControllerBase
{
  // Service responsible for account business logic.
  private readonly AccountService _accountService;

  /*===========================================================
    AccountsController Constructor
  ===========================================================*/
  public AccountsController(
    AccountService accountService)
  {
    _accountService =
      accountService;
  }

  /*===========================================================
    GetAccounts:
    => Gets all financial accounts owned by the logged-in user.

    GET /api/budget/accounts
  ===========================================================*/
  [HttpGet]
  public async Task<ActionResult<List<FinancialAccountResponse>>>
    GetAccounts()
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    var accounts =
      await _accountService.GetAccountsAsync(
        userId);

    return Ok(
      accounts);
  }

  /*===========================================================
    CreateAccount:
    => Creates a new financial account.
    => Supports Checking, Savings, and CreditCard accounts.

    POST /api/budget/accounts
  ===========================================================*/
  [HttpPost]
  public async Task<ActionResult<FinancialAccountResponse>>
    CreateAccount(
      CreateFinancialAccountRequest request)
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(
        request.Name))
    {
      return BadRequest(
        new
        {
          message =
            "Account name is required."
        });
    }

    if (!IsValidAccountType(
        request.Type))
    {
      return BadRequest(
        new
        {
          message =
            "Account type must be Checking, Savings, or CreditCard."
        });
    }

    var account =
      await _accountService.CreateAccountAsync(
        request,
        userId);

    return Ok(
      account);
  }

  /*===========================================================
    UpdateAccount:
    => Updates an existing financial account.
    => Returns 404 when the account does not exist or does
       not belong to the logged-in user.

    PUT /api/budget/accounts/{accountId}
  ===========================================================*/
  [HttpPut("{accountId}")]
  public async Task<ActionResult<FinancialAccountResponse>>
    UpdateAccount(
      string accountId,
      UpdateFinancialAccountRequest request)
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(
        accountId))
    {
      return BadRequest(
        new
        {
          message =
            "Account ID is required."
        });
    }

    if (string.IsNullOrWhiteSpace(
        request.Name))
    {
      return BadRequest(
        new
        {
          message =
            "Account name is required."
        });
    }

    if (!IsValidAccountType(
        request.Type))
    {
      return BadRequest(
        new
        {
          message =
            "Account type must be Checking, Savings, or CreditCard."
        });
    }

    var updatedAccount =
      await _accountService.UpdateAccountAsync(
        accountId,
        request,
        userId);

    if (updatedAccount is null)
    {
      return NotFound(
        new
        {
          message =
            "Account not found."
        });
    }

    return Ok(
      updatedAccount);
  }

  /*===========================================================
    DeleteAccount:
    => Deletes an account owned by the logged-in user.
    => Prevents deletion when the account has transaction
       history.
    => Returns 409 Conflict when deletion is blocked.

    DELETE /api/budget/accounts/{accountId}
  ===========================================================*/
  [HttpDelete("{accountId}")]
  public async Task<ActionResult<FinancialAccountResponse>>
    DeleteAccount(
      string accountId)
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(
        accountId))
    {
      return BadRequest(
        new
        {
          message =
            "Account ID is required."
        });
    }

    try
    {
      var deletedAccount =
        await _accountService.DeleteAccountAsync(
          accountId,
          userId);

      if (deletedAccount is null)
      {
        return NotFound(
          new
          {
            message =
              "Account was not found."
          });
      }

      return Ok(
        deletedAccount);
    }
    catch (InvalidOperationException)
    {
      return Conflict(
        new
        {
          message =
            "This account cannot be deleted because it has transaction history."
        });
    }
  }
}