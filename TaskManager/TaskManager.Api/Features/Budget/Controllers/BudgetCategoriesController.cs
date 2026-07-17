using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

[ApiController]
[Route("api/budget")]
public class BudgetCategoriesController : BudgetControllerBase
{
  private readonly BudgetCategoryService _categoryService;

  /*===========================================================
    BudgetCategoriesController Constructor:
    => Receives BudgetCategoryService from dependency injection.
  ===========================================================*/
  public BudgetCategoriesController(
    BudgetCategoryService categoryService)
  {
    _categoryService = categoryService;
  }

  /*===========================================================
    AddBudgetCategory:
    => Creates a category inside a budget month.
    => Requires Fixed or Variable for Expense categories.
    => Returns the newly created category.
  ===========================================================*/
  [HttpPost("months/{budgetMonthId}/categories")]
  public async Task<ActionResult<BudgetCategoryResponse>>
    AddBudgetCategory(
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
      return BadRequest(
        "Category type must be Expense, or Savings.");
    }

    var classificationError =
      ValidateCategoryClassification(
        request.Type,
        request.ExpenseType);

    if (classificationError != null)
    {
      return BadRequest(classificationError);
    }

    if (request.PlannedAmount < 0)
    {
      return BadRequest(
        "Planned amount cannot be negative.");
    }

    var category =
      await _categoryService.AddBudgetCategoryAsync(
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
    => Updates a budget category.
    => Validates its main type and expense classification.
    => Returns the updated category.
  ===========================================================*/
  [HttpPut("categories/{categoryId}")]
  public async Task<ActionResult<BudgetCategoryResponse>>
    UpdateBudgetCategory(
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
      return BadRequest(
        "Category type must be Expense, or Savings.");
    }

    var classificationError =
      ValidateCategoryClassification(
        request.Type,
        request.ExpenseType);

    if (classificationError != null)
    {
      return BadRequest(classificationError);
    }

    if (request.PlannedAmount < 0)
    {
      return BadRequest(
        "Planned amount cannot be negative.");
    }

    var updatedCategory =
      await _categoryService.UpdateBudgetCategoryAsync(
        categoryId,
        request,
        userId);

    if (updatedCategory == null)
    {
      return NotFound("Budget category not found.");
    }

    return Ok(updatedCategory);
  }

  /*===========================================================
    DeleteBudgetCategory:
    => Deletes one budget category.
    => Returns the deleted category information.
  ===========================================================*/
  [HttpDelete("categories/{categoryId}")]
  public async Task<ActionResult<BudgetCategoryResponse>>
    DeleteBudgetCategory(string categoryId)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var deletedCategory =
      await _categoryService.DeleteBudgetCategoryAsync(
        categoryId,
        userId);

    if (deletedCategory == null)
    {
      return NotFound("Budget category not found.");
    }

    return Ok(deletedCategory);
  }
}