using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

[ApiController]
[Route("api/budget/admin")]
public class BudgetAdminController
  : BudgetControllerBase
{
  private readonly BudgetAdminService
    _budgetAdminService;

  /*===========================================================
    BudgetAdminController Constructor
  ===========================================================*/
  public BudgetAdminController(
    BudgetAdminService budgetAdminService)
  {
    _budgetAdminService =
      budgetAdminService;
  }

  /*===========================================================
    DeleteAllTransactions
  ===========================================================*/
  [HttpPost("delete-all-transactions")]
  public async Task<ActionResult<
    DeleteBudgetGroupResponse>>
    DeleteAllTransactions(
      [FromBody]
      DeleteBudgetGroupRequest request)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (!IsConfirmed(
      request,
      "DELETE ALL TRANSACTIONS"))
    {
      return BadRequest(
        "Confirmation must be exactly: DELETE ALL TRANSACTIONS");
    }

    var result =
      await _budgetAdminService
        .DeleteAllTransactionsAsync(
          userId);

    return Ok(result);
  }

  /*===========================================================
    DeleteAllTransfers
  ===========================================================*/
  [HttpPost("delete-all-transfers")]
  public async Task<ActionResult<
    DeleteBudgetGroupResponse>>
    DeleteAllTransfers(
      [FromBody]
      DeleteBudgetGroupRequest request)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (!IsConfirmed(
      request,
      "DELETE ALL TRANSFERS"))
    {
      return BadRequest(
        "Confirmation must be exactly: DELETE ALL TRANSFERS");
    }

    var result =
      await _budgetAdminService
        .DeleteAllTransfersAsync(
          userId);

    return Ok(result);
  }

  /*===========================================================
    DeleteAllIncome
  ===========================================================*/
  [HttpPost("delete-all-income")]
  public async Task<ActionResult<
    DeleteBudgetGroupResponse>>
    DeleteAllIncome(
      [FromBody]
      DeleteBudgetGroupRequest request)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (!IsConfirmed(
      request,
      "DELETE ALL INCOME"))
    {
      return BadRequest(
        "Confirmation must be exactly: DELETE ALL INCOME");
    }

    var result =
      await _budgetAdminService
        .DeleteAllIncomeAsync(
          userId);

    return Ok(result);
  }

  /*===========================================================
    DeleteAllExpenses
  ===========================================================*/
  [HttpPost("delete-all-expenses")]
  public async Task<ActionResult<
    DeleteBudgetGroupResponse>>
    DeleteAllExpenses(
      [FromBody]
      DeleteBudgetGroupRequest request)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (!IsConfirmed(
      request,
      "DELETE ALL EXPENSES"))
    {
      return BadRequest(
        "Confirmation must be exactly: DELETE ALL EXPENSES");
    }

    var result =
      await _budgetAdminService
        .DeleteAllExpensesAsync(
          userId);

    return Ok(result);
  }

  /*===========================================================
    DeleteAllBills
  ===========================================================*/
  [HttpPost("delete-all-bills")]
  public async Task<ActionResult<
    DeleteBudgetGroupResponse>>
    DeleteAllBills(
      [FromBody]
      DeleteBudgetGroupRequest request)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (!IsConfirmed(
      request,
      "DELETE ALL BILLS"))
    {
      return BadRequest(
        "Confirmation must be exactly: DELETE ALL BILLS");
    }

    var result =
      await _budgetAdminService
        .DeleteAllBillsAsync(
          userId);

    return Ok(result);
  }

  /*===========================================================
    DeleteAllRecurringTemplates
  ===========================================================*/
  [HttpPost(
    "delete-all-recurring-bill-templates")]
  public async Task<ActionResult<
    DeleteBudgetGroupResponse>>
    DeleteAllRecurringTemplates(
      [FromBody]
      DeleteBudgetGroupRequest request)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (!IsConfirmed(
      request,
      "DELETE ALL RECURRING BILL TEMPLATES"))
    {
      return BadRequest(
        "Confirmation must be exactly: DELETE ALL RECURRING BILL TEMPLATES");
    }

    var result =
      await _budgetAdminService
        .DeleteAllRecurringTemplatesAsync(
          userId);

    return Ok(result);
  }

  /*===========================================================
    DeleteAllCategories
  ===========================================================*/
  [HttpPost("delete-all-categories")]
  public async Task<ActionResult<
    DeleteBudgetGroupResponse>>
    DeleteAllCategories(
      [FromBody]
    DeleteBudgetGroupRequest request)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (!IsConfirmed(
      request,
      "DELETE ALL CATEGORIES"))
    {
      return BadRequest(
        "Confirmation must be exactly: DELETE ALL CATEGORIES");
    }

    var result =
      await _budgetAdminService
        .DeleteAllCategoriesAsync(
          userId);

    if (result == null)
    {
      return Conflict(
        "Categories cannot be deleted while bills still reference them. Delete the bills first.");
    }

    return Ok(result);
  }
  /*===========================================================
    DeleteAllBudgetMonths
  ===========================================================*/
  [HttpPost("delete-all-budget-months")]
  public async Task<ActionResult<
    DeleteBudgetGroupResponse>>
    DeleteAllBudgetMonths(
      [FromBody]
      DeleteBudgetGroupRequest request)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (!IsConfirmed(
      request,
      "DELETE ALL BUDGET MONTHS"))
    {
      return BadRequest(
        "Confirmation must be exactly: DELETE ALL BUDGET MONTHS");
    }

    var result =
      await _budgetAdminService
        .DeleteAllBudgetMonthsAsync(
          userId);

    return Ok(result);
  }

  /*===========================================================
    DeleteAllAccounts
  ===========================================================*/
  [HttpPost("delete-all-accounts")]
  public async Task<ActionResult<
    DeleteBudgetGroupResponse>>
    DeleteAllAccounts(
      [FromBody]
      DeleteBudgetGroupRequest request)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (!IsConfirmed(
      request,
      "DELETE ALL ACCOUNTS"))
    {
      return BadRequest(
        "Confirmation must be exactly: DELETE ALL ACCOUNTS");
    }

    var result =
      await _budgetAdminService
        .DeleteAllAccountsAsync(
          userId);

    if (result == null)
    {
      return Conflict(
        "Accounts cannot be deleted while income, expenses, or transfers still reference them.");
    }

    return Ok(result);
  }

  /*===========================================================
    DeleteAllBudgetData
  ===========================================================*/
  [HttpPost("delete-all")]
  public async Task<ActionResult<
    DeleteBudgetGroupResponse>>
    DeleteAllBudgetData(
      [FromBody]
      DeleteBudgetGroupRequest request)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (!IsConfirmed(
      request,
      "DELETE ALL"))
    {
      return BadRequest(
        "Confirmation must be exactly: DELETE ALL");
    }

    var result =
      await _budgetAdminService
        .DeleteAllBudgetDataAsync(
          userId);

    return Ok(result);
  }

  /*===========================================================
    IsConfirmed
  ===========================================================*/
  private static bool IsConfirmed(
    DeleteBudgetGroupRequest? request,
    string expectedConfirmation)
  {
    return
      request != null &&
      string.Equals(
        request.Confirmation?.Trim(),
        expectedConfirmation,
        StringComparison.Ordinal);
  }
}