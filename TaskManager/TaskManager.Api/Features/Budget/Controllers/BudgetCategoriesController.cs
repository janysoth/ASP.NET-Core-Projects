using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

[ApiController]
[Route("api/budget")]
public class BudgetCategoriesController : BudgetControllerBase
{
  private readonly BudgetCategoryService _categoryService;

  public BudgetCategoriesController(BudgetCategoryService categoryService)
  {
    _categoryService = categoryService;
  }

  [HttpPost("months/{budgetMonthId}/categories")]
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

    var category = await _categoryService.AddBudgetCategoryAsync(
      budgetMonthId,
      request,
      userId);

    if (category == null)
    {
      return NotFound("Budget month not found.");
    }

    return Ok(category);
  }

  [HttpPut("categories/{categoryId}")]
  public async Task<ActionResult<BudgetCategoryResponse>> UpdateBudgetCategory(
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

    var updatedCategory = await _categoryService.UpdateBudgetCategoryAsync(
      categoryId,
      request,
      userId);

    if (updatedCategory == null)
    {
      return NotFound("Budget category not found.");
    }

    return Ok(updatedCategory);
  }

  [HttpDelete("categories/{categoryId}")]
  public async Task<ActionResult<BudgetCategoryResponse>> DeleteBudgetCategory(
    string categoryId)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var deletedCategory = await _categoryService.DeleteBudgetCategoryAsync(
      categoryId,
      userId);

    if (deletedCategory == null)
    {
      return NotFound("Budget category not found.");
    }

    return Ok(deletedCategory);
  }
}