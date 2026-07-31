using Microsoft.AspNetCore.Mvc;
// using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

// Marks this class as an API controller.
// Enables automatic model binding and validation.
[ApiController]

// Base route for all account endpoints.
// Example:
// GET    /api/budget/accounts
// POST   /api/budget/accounts
// PUT    /api/budget/accounts/{accountId}
// DELETE /api/budget/accounts/{accountId}
[Route("api/budget/accounts")]
public class AccountsController : BudgetControllerBase
{
  // Service responsible for account business logic
  private readonly AccountService _accountService;

  // Constructor used for Dependency Injection (DI)
  public AccountsController(AccountService accountService)
  {
    _accountService = accountService;
  }

  // ==========================================
  // GET: api/budget/accounts
  // Returns all financial accounts
  // for the currently logged-in user.
  // ==========================================
  [HttpGet]
  public async Task<ActionResult<List<FinancialAccountResponse>>> GetAccounts()
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Retrieve all accounts belonging to this user
    var accounts = await _accountService.GetAccountsAsync(userId);

    // Return the list of accounts
    return Ok(accounts);
  }

  // ==========================================
  // POST: api/budget/accounts
  // Creates a new financial account.
  // ==========================================
  [HttpPost]
  public async Task<ActionResult<FinancialAccountResponse>> CreateAccount(
    CreateFinancialAccountRequest request)
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Validate that an account name was provided
    if (string.IsNullOrWhiteSpace(request.Name))
    {
      return BadRequest("Account name is required.");
    }

    // Validate that the account type is supported
    if (!IsValidAccountType(request.Type))
    {
      return BadRequest("Account type must be Checking, Savings, or CreditCard.");
    }

    // Create the new financial account
    var account = await _accountService.CreateAccountAsync(request, userId);

    // Return the newly created account
    return Ok(account);
  }

  // ==========================================
  // PUT: api/budget/accounts/{accountId}
  // Updates an existing financial account.
  // ==========================================
  [HttpPut("{accountId}")]
  public async Task<ActionResult<FinancialAccountResponse>> UpdateAccount(
    string accountId,
    UpdateFinancialAccountRequest request)
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Validate that an account name was provided
    if (string.IsNullOrWhiteSpace(request.Name))
    {
      return BadRequest("Account name is required.");
    }

    // Validate that the account type is supported
    if (!IsValidAccountType(request.Type))
    {
      return BadRequest("Account type must be Checking, Savings, or CreditCard.");
    }

    // Update the account
    var updatedAccount = await _accountService.UpdateAccountAsync(
      accountId,
      request,
      userId);

    // Return 404 if the account does not exist
    // or does not belong to the current user
    if (updatedAccount == null)
    {
      return NotFound("Account not found.");
    }

    // Return the updated account
    return Ok(updatedAccount);
  }

  /*===========================================================
    DeleteAccount:
    => Deletes an account owned by the current user.
    => Prevents deletion when the account has transaction
       history.
  ===========================================================*/
  [HttpDelete("{accountId}")]
  public async Task<ActionResult<FinancialAccountResponse>>
    DeleteAccount(
      string accountId)
  {
    var userId = GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(accountId))
    {
      return BadRequest(
        new
        {
          message = "Account ID is required."
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
            message = "Account was not found."
          });
      }

      return Ok(deletedAccount);
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