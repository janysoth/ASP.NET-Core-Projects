using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

// Marks this class as an API controller.
[ApiController]

// Base route for transaction endpoints.
// Example:
// GET /api/budget/transactions
// GET /api/budget/transactions?month=7
// GET /api/budget/transactions?year=2026
// GET /api/budget/transactions?month=7&year=2026
[Route("api/budget/transactions")]
public class TransactionsController : BudgetControllerBase
{
  // Service responsible for combining income,
  // expenses, and transfers into one transaction list.
  private readonly TransactionService _transactionService;

  // Constructor used for Dependency Injection (DI)
  public TransactionsController(TransactionService transactionService)
  {
    _transactionService = transactionService;
  }

  /*===========================================================
    GetTransactions:
    => Gets transactions for the logged-in user.
    => Supports optional filters for:
       - Month
       - Year
       - Account type
       - Transaction type

    Examples:

    GET /api/budget/transactions

    GET /api/budget/transactions
        ?accountType=Checking

    GET /api/budget/transactions
        ?transactionType=Expense

    GET /api/budget/transactions
        ?accountType=Checking
        &transactionType=Income

    GET /api/budget/transactions
        ?month=7
        &year=2026
        &accountType=Checking
        &transactionType=Expense
  ===========================================================*/
  [HttpGet]
  public async Task<ActionResult<List<TransactionResponse>>>
    GetTransactions(
      [FromQuery] int? month,
      [FromQuery] int? year,
      [FromQuery] string? accountType,
      [FromQuery] string? transactionType)
  {
    /*---------------------------------------------------------
      Get the authenticated user's ID
    ---------------------------------------------------------*/
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    /*---------------------------------------------------------
      Validate the month
    ---------------------------------------------------------*/
    if (month.HasValue &&
        (month.Value < 1 ||
         month.Value > 12))
    {
      return BadRequest(
        new
        {
          message =
            "Month must be between 1 and 12."
        });
    }

    /*---------------------------------------------------------
      Validate the year
    ---------------------------------------------------------*/
    if (year.HasValue &&
        year.Value < 2000)
    {
      return BadRequest(
        new
        {
          message =
            "Year is invalid."
        });
    }

    /*---------------------------------------------------------
      When month is supplied without year, use the current year.

      This matches your existing transaction behavior.
    ---------------------------------------------------------*/

    /*---------------------------------------------------------
      Validate accountType
    ---------------------------------------------------------*/
    var validAccountTypes =
      new[]
      {
      "Checking",
      "Savings",
      "CreditCard"
      };

    if (!string.IsNullOrWhiteSpace(accountType) &&
        !validAccountTypes.Contains(
          accountType.Trim(),
          StringComparer.OrdinalIgnoreCase))
    {
      return BadRequest(
        new
        {
          message =
            "Account type must be Checking, Savings, or CreditCard."
        });
    }

    /*---------------------------------------------------------
      Validate transactionType
    ---------------------------------------------------------*/
    var validTransactionTypes =
      new[]
      {
      TransactionTypes.Income,
      TransactionTypes.Expense,
      TransactionTypes.Transfer
      };

    if (!string.IsNullOrWhiteSpace(transactionType) &&
        !validTransactionTypes.Contains(
          transactionType.Trim(),
          StringComparer.OrdinalIgnoreCase))
    {
      return BadRequest(
        new
        {
          message =
            "Transaction type must be Income, Expense, or Transfer."
        });
    }

    /*---------------------------------------------------------
      Get the filtered transactions
    ---------------------------------------------------------*/
    var transactions =
      await _transactionService.GetTransactionsAsync(
        userId,
        month,
        year,
        accountType,
        transactionType);

    return Ok(
      transactions);
  }

}