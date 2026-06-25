using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BudgetController : ControllerBase
{
  private readonly BudgetService _budgetService;

  /*===========================================================
    BudgetController Constructor:
    => Receives BudgetService from dependency injection.
    => Allows this controller to call budget business logic.
  ===========================================================*/
  public BudgetController(BudgetService budgetService)
  {
    _budgetService = budgetService;
  }

  /*===========================================================
    GetAccounts:
    => Gets all financial accounts for the logged-in user.
    => Includes checking, savings, and credit card accounts.
    => Returns each account with its calculated current balance.
  ===========================================================*/
  [HttpGet("accounts")]
  public async Task<ActionResult<List<FinancialAccountResponse>>> GetAccounts()
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var accounts = await _budgetService.GetAccountsAsync(userId);

    return Ok(accounts);
  }

  /*===========================================================
    CreateAccount:
    => Creates a new financial account.
    => Validates account name, type, and starting balance.
    => Returns the newly created account.
  ===========================================================*/
  [HttpPost("accounts")]
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

    var account = await _budgetService.CreateAccountAsync(request, userId);

    return Ok(account);
  }

  /*===========================================================
    UpdateAccount:
    => Updates an existing financial account.
    => Validates account name, type, and starting balance.
    => Returns the updated account.
  ===========================================================*/
  [HttpPut("accounts/{accountId}")]
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

    var updatedAccount = await _budgetService.UpdateAccountAsync(
      accountId,
      request,
      userId);

    if (updatedAccount == null)
    {
      return NotFound("Account not found.");
    }

    return Ok(updatedAccount);
  }

  /*===========================================================
    DeleteAccount:
    => Deletes one financial account.
    => Only deletes the account if it belongs to the logged-in user.
    => Returns the deleted account information.
  ===========================================================*/
  [HttpDelete("accounts/{accountId}")]
  public async Task<ActionResult<FinancialAccountResponse>> DeleteAccount(
    string accountId)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var deletedAccount = await _budgetService.DeleteAccountAsync(accountId, userId);

    if (deletedAccount == null)
    {
      return NotFound("Account not found.");
    }

    return Ok(deletedAccount);
  }

  /*===========================================================
    GetTransfers:
    => Gets all account transfers for the logged-in user.
    => Used for credit card payments and moving money between accounts.
    => Returns transfers sorted by newest transfer date first.
  ===========================================================*/
  [HttpGet("transfers")]
  public async Task<ActionResult<List<AccountTransferResponse>>> GetTransfers()
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var transfers = await _budgetService.GetTransfersAsync(userId);

    return Ok(transfers);
  }

  /*===========================================================
    CreateTransfer:
    => Creates a transfer between two accounts.
    => Used for credit card payments or moving money between accounts.
    => Transfers are not budget expenses, so they prevent double-counting.
  ===========================================================*/
  [HttpPost("transfers")]
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

    var transfer = await _budgetService.CreateTransferAsync(request, userId);

    if (transfer == null)
    {
      return NotFound("One or both accounts were not found.");
    }

    return Ok(transfer);
  }

  /*===========================================================
    DeleteTransfer:
    => Deletes one account transfer.
    => Only deletes the transfer if it belongs to the logged-in user.
    => Returns the deleted transfer information.
  ===========================================================*/
  [HttpDelete("transfers/{transferId}")]
  public async Task<ActionResult<AccountTransferResponse>> DeleteTransfer(
    string transferId)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var deletedTransfer = await _budgetService.DeleteTransferAsync(
      transferId,
      userId);

    if (deletedTransfer == null)
    {
      return NotFound("Transfer not found.");
    }

    return Ok(deletedTransfer);
  }

  /*===========================================================
    GetBudgetMonths:
    => Gets all budget months for the logged-in user.
    => Uses the user ID from the JWT token.
    => Returns a list of budget month summaries.
  ===========================================================*/
  [HttpGet]
  public async Task<ActionResult<List<BudgetMonthResponse>>> GetBudgetMonths()
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var budgetMonths = await _budgetService.GetBudgetMonthsAsync(userId);

    return Ok(budgetMonths);
  }

  /*===========================================================
    GetBudgetMonthById:
    => Gets one budget month by ID.
    => Only returns the budget month if it belongs to the logged-in user.
    => Returns 404 if the budget month is not found.
  ===========================================================*/
  [HttpGet("{id}")]
  public async Task<ActionResult<BudgetMonthResponse>> GetBudgetMonthById(
    string id)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var budgetMonth = await _budgetService.GetBudgetMonthByIdAsync(id, userId);

    if (budgetMonth == null)
    {
      return NotFound("Budget month not found.");
    }

    return Ok(budgetMonth);
  }

  /*===========================================================
    CreateBudgetMonth:
    => Creates a new budget month for the logged-in user.
    => Validates month, year, and planned income.
    => Returns the newly created budget month.
  ===========================================================*/
  [HttpPost]
  public async Task<ActionResult<BudgetMonthResponse>> CreateBudgetMonth(
    CreateBudgetMonthRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (request.Month < 1 || request.Month > 12)
    {
      return BadRequest("Month must be between 1 and 12.");
    }

    if (request.Year < 2000)
    {
      return BadRequest("Year is invalid.");
    }

    if (request.PlannedIncome < 0)
    {
      return BadRequest("Planned income cannot be negative.");
    }

    var createdBudgetMonth = await _budgetService.CreateBudgetMonthAsync(
      request,
      userId);

    return CreatedAtAction(
      nameof(GetBudgetMonthById),
      new { id = createdBudgetMonth.Id },
      createdBudgetMonth);
  }

  /*===========================================================
    UpdateBudgetMonth:
    => Updates the planned income for a budget month.
    => Validates that planned income is not negative.
    => Returns 404 if the budget month is not found.
  ===========================================================*/
  [HttpPut("{id}")]
  public async Task<IActionResult> UpdateBudgetMonth(
    string id,
    UpdateBudgetMonthRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (request.PlannedIncome < 0)
    {
      return BadRequest("Planned income cannot be negative.");
    }

    var updated = await _budgetService.UpdateBudgetMonthAsync(
      id,
      request,
      userId);

    if (!updated)
    {
      return NotFound("Budget month not found.");
    }

    return NoContent();
  }

  /*===========================================================
    DeleteBudgetMonth:
    => Deletes a budget month for the logged-in user.
    => Also deletes related categories, income records, and expense records.
    => Returns 404 if the budget month is not found.
  ===========================================================*/
  [HttpDelete("{id}")]
  public async Task<IActionResult> DeleteBudgetMonth(string id)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var deleted = await _budgetService.DeleteBudgetMonthAsync(id, userId);

    if (!deleted)
    {
      return NotFound("Budget month not found.");
    }

    return NoContent();
  }

  /*===========================================================
    AddBudgetCategory:
    => Creates a planned budget category.
    => Category type must be Expense, Savings, or Debt.
    => Returns the newly created category.
  ===========================================================*/
  [HttpPost("{budgetMonthId}/categories")]
  public async Task<ActionResult<BudgetCategoryResponse>> AddBudgetCategory(
    string budgetMonthId,
    CreateBudgetCategoryRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(request.Name))
    {
      return BadRequest("Category name is required.");
    }

    if (!IsValidCategoryType(request.Type))
    {
      return BadRequest("Category type must be Expense, Savings, or Debt.");
    }

    if (request.PlannedAmount < 0)
    {
      return BadRequest("Planned amount cannot be negative.");
    }

    var category = await _budgetService.AddBudgetCategoryAsync(
      budgetMonthId,
      request,
      userId);

    if (category == null)
    {
      return NotFound("Budget month not found.");
    }

    return Ok(category);
  }

  /*===========================================================
    UpdateBudgetCategory:
    => Updates a planned budget category.
    => Validates category name, type, and planned amount.
    => Returns 404 if the category is not found.
  ===========================================================*/
  [HttpPut("categories/{categoryId}")]
  public async Task<IActionResult> UpdateBudgetCategory(
    string categoryId,
    UpdateBudgetCategoryRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(request.Name))
    {
      return BadRequest("Category name is required.");
    }

    if (!IsValidCategoryType(request.Type))
    {
      return BadRequest("Category type must be Expense, Savings, or Debt.");
    }

    if (request.PlannedAmount < 0)
    {
      return BadRequest("Planned amount cannot be negative.");
    }

    var updated = await _budgetService.UpdateBudgetCategoryAsync(
      categoryId,
      request,
      userId);

    if (!updated)
    {
      return NotFound("Budget category not found.");
    }

    return NoContent();
  }

  /*===========================================================
    DeleteBudgetCategory:
    => Deletes one planned budget category.
    => Only deletes the category if it belongs to the logged-in user.
    => Returns the deleted category information.
  ===========================================================*/
  [HttpDelete("categories/{categoryId}")]
  public async Task<ActionResult<BudgetCategoryResponse>> DeleteBudgetCategory(
    string categoryId)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var deletedCategory = await _budgetService.DeleteBudgetCategoryAsync(
      categoryId,
      userId);

    if (deletedCategory == null)
    {
      return NotFound("Budget category not found.");
    }

    return Ok(deletedCategory);
  }

  /*===========================================================
    AddIncome:
    => Adds an income record to a budget month.
    => Validates account, income source, and amount.
    => Returns the newly created income record.
  ===========================================================*/
  [HttpPost("{budgetMonthId}/income")]
  public async Task<ActionResult<IncomeResponse>> AddIncome(
    string budgetMonthId,
    CreateIncomeRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(request.AccountId))
    {
      return BadRequest("Account is required.");
    }

    if (string.IsNullOrWhiteSpace(request.Source))
    {
      return BadRequest("Income source is required.");
    }

    if (request.Amount <= 0)
    {
      return BadRequest("Income amount must be greater than 0.");
    }

    var income = await _budgetService.AddIncomeAsync(
      budgetMonthId,
      request,
      userId);

    if (income == null)
    {
      return NotFound("Budget month or account not found.");
    }

    return Ok(income);
  }

  /*===========================================================
    UpdateIncome:
    => Updates an existing income record.
    => Validates account, income source, and amount.
    => Returns 404 if the income record or account is not found.
  ===========================================================*/
  [HttpPut("income/{incomeId}")]
  public async Task<IActionResult> UpdateIncome(
    string incomeId,
    UpdateIncomeRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(request.AccountId))
    {
      return BadRequest("Account is required.");
    }

    if (string.IsNullOrWhiteSpace(request.Source))
    {
      return BadRequest("Income source is required.");
    }

    if (request.Amount <= 0)
    {
      return BadRequest("Income amount must be greater than 0.");
    }

    var updated = await _budgetService.UpdateIncomeAsync(
      incomeId,
      request,
      userId);

    if (!updated)
    {
      return NotFound("Income record or account not found.");
    }

    return NoContent();
  }

  /*===========================================================
    DeleteIncome:
    => Deletes one income record.
    => Only deletes the income if it belongs to the logged-in user.
    => Returns the deleted income information.
  ===========================================================*/
  [HttpDelete("income/{incomeId}")]
  public async Task<ActionResult<IncomeResponse>> DeleteIncome(string incomeId)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var deletedIncome = await _budgetService.DeleteIncomeAsync(
      incomeId,
      userId);

    if (deletedIncome == null)
    {
      return NotFound("Income record not found.");
    }

    return Ok(deletedIncome);
  }

  /*===========================================================
    AddExpense:
    => Adds an expense record to a budget month.
    => Validates account, category, name, and amount.
    => Returns the newly created expense record.
  ===========================================================*/
  [HttpPost("{budgetMonthId}/expense")]
  public async Task<ActionResult<ExpenseResponse>> AddExpense(
    string budgetMonthId,
    CreateExpenseRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(request.AccountId))
    {
      return BadRequest("Account is required.");
    }

    if (string.IsNullOrWhiteSpace(request.Category))
    {
      return BadRequest("Expense category is required.");
    }

    if (string.IsNullOrWhiteSpace(request.Name))
    {
      return BadRequest("Expense name is required.");
    }

    if (request.Amount <= 0)
    {
      return BadRequest("Expense amount must be greater than 0.");
    }

    var expense = await _budgetService.AddExpenseAsync(
      budgetMonthId,
      request,
      userId);

    if (expense == null)
    {
      return NotFound("Budget month or account not found.");
    }

    return Ok(expense);
  }

  /*===========================================================
    UpdateExpense:
    => Updates an existing expense record.
    => Validates account, category, name, and amount.
    => Returns 404 if the expense record or account is not found.
  ===========================================================*/
  [HttpPut("expense/{expenseId}")]
  public async Task<IActionResult> UpdateExpense(
    string expenseId,
    UpdateExpenseRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(request.AccountId))
    {
      return BadRequest("Account is required.");
    }

    if (string.IsNullOrWhiteSpace(request.Category))
    {
      return BadRequest("Expense category is required.");
    }

    if (string.IsNullOrWhiteSpace(request.Name))
    {
      return BadRequest("Expense name is required.");
    }

    if (request.Amount <= 0)
    {
      return BadRequest("Expense amount must be greater than 0.");
    }

    var updated = await _budgetService.UpdateExpenseAsync(
      expenseId,
      request,
      userId);

    if (!updated)
    {
      return NotFound("Expense record or account not found.");
    }

    return NoContent();
  }

  /*===========================================================
    DeleteExpense:
    => Deletes one expense record.
    => Only deletes the expense if it belongs to the logged-in user.
    => Returns the deleted expense information.
  ===========================================================*/
  [HttpDelete("expense/{expenseId}")]
  public async Task<ActionResult<ExpenseResponse>> DeleteExpense(
    string expenseId)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var deletedExpense = await _budgetService.DeleteExpenseAsync(
      expenseId,
      userId);

    if (deletedExpense == null)
    {
      return NotFound("Expense record not found.");
    }

    return Ok(deletedExpense);
  }

  /*===========================================================
    GetUserId:
    => Reads the logged-in user's ID from the JWT token.
    => Used to make sure users only access their own budget data.
    => Returns null if the token does not contain a valid user ID.
  ===========================================================*/
  private string? GetUserId()
  {
    return User.FindFirstValue(ClaimTypes.NameIdentifier)
      ?? User.FindFirstValue("id")
      ?? User.FindFirstValue("sub");
  }

  /*===========================================================
    IsValidCategoryType:
    => Checks if the budget category type is allowed.
    => Allowed types are Expense, Savings, and Debt.
    => Prevents random or invalid category types from being saved.
  ===========================================================*/
  private static bool IsValidCategoryType(string type)
  {
    var allowedTypes = new[] { "Expense", "Savings", "Debt" };

    return allowedTypes.Contains(type, StringComparer.OrdinalIgnoreCase);
  }

  /*===========================================================
    IsValidAccountType:
    => Checks if the financial account type is allowed.
    => Allowed types are Checking, Savings, and CreditCard.
    => Prevents random or invalid account types from being saved.
  ===========================================================*/
  private static bool IsValidAccountType(string type)
  {
    var allowedTypes = new[] { "Checking", "Savings", "CreditCard" };

    return allowedTypes.Contains(type, StringComparer.OrdinalIgnoreCase);
  }
}