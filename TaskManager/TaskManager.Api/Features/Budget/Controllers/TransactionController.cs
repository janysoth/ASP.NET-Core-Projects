using Microsoft.AspNetCore.Mvc;
// using TaskManager.Api.Features.Budget.DTOs;
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

  // ==========================================
  // GET: api/budget/transactions
  // Gets all transactions for the logged-in user.
  //
  // Results can optionally be filtered by
  // transaction month, year, or both.
  // ==========================================
  [HttpGet]
  public async Task<ActionResult<List<TransactionResponse>>> GetTransactions(
    [FromQuery] int? month,
    [FromQuery] int? year)
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Validate the month if one was provided.
    // A valid month must be between January (1)
    // and December (12).
    if (month.HasValue && (month.Value < 1 || month.Value > 12))
    {
      return BadRequest("Month must be between 1 and 12.");
    }

    // Validate the year if one was provided
    if (year.HasValue && year.Value < 2000)
    {
      return BadRequest("Year is invalid.");
    }

    // Get the user's income, expenses, and transfers.
    //
    // The service filters each record by its own date:
    // IncomeDate, ExpenseDate, or TransferDate.
    var transactions = await _transactionService.GetTransactionsAsync(
      userId,
      month,
      year);

    // Return the combined and sorted transaction list
    return Ok(transactions);
  }
}