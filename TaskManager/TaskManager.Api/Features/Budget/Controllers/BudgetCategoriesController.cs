using Microsoft.AspNetCore.Mvc;
// using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

// Marks this class as an API controller.
[ApiController]

// Base route for budget-related endpoints.
// Example:
// POST   /api/budget/months/{budgetMonthId}/categories
// PUT    /api/budget/categories/{categoryId}
// DELETE /api/budget/categories/{categoryId}
[Route("api/budget")]
public class BudgetCategoriesController : BudgetControllerBase
{
  // Service responsible for budget category business logic
  private readonly BudgetCategoryService _categoryService;

  // Constructor used for Dependency Injection (DI)
  public BudgetCategoriesController(BudgetCategoryService categoryService)
  {
    _categoryService = categoryService;
  }

  // ==========================================
  // POST: api/budget/months/{budgetMonthId}/categories
  // Adds a new category to a budget month.
  // ==========================================
  [HttpPost("months/{budgetMonthId}/categories")]
  public async Task<ActionResult<BudgetCategoryResponse>> AddBudgetCategory(
    string budgetMonthId,
    CreateBudgetCategoryRequest request)
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Validate that the category name was provided
    if (string.IsNullOrWhiteSpace(request.Name))
    {
      return BadRequest("Category name is required.");
    }

    // Validate that the category type is supported
    if (!IsValidCategoryType(request.Type))
    {
      return BadRequest("Category type must be Expense, Savings, or Debt.");
    }

    // Prevent negative planned budget amounts
    if (request.PlannedAmount < 0)
    {
      return BadRequest("Planned amount cannot be negative.");
    }

    // Add the category to the selected budget month
    var category = await _categoryService.AddBudgetCategoryAsync(
      budgetMonthId,
      request,
      userId);

    // Return 404 if the budget month does not exist
    // or does not belong to the current user
    if (category == null)
    {
      return NotFound("Budget month not found.");
    }

    // Return the newly created category
    return Ok(category);
  }

  // ==========================================
  // PUT: api/budget/months/categories/{categoryId}
  // Updates an existing budget category.
  // ==========================================
  [HttpPut("months/categories/{categoryId}")]
  public async Task<ActionResult<BudgetCategoryResponse>> UpdateBudgetCategory(
    string categoryId,
    UpdateBudgetCategoryRequest request)
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Validate that the category name was provided
    if (string.IsNullOrWhiteSpace(request.Name))
    {
      return BadRequest("Category name is required.");
    }

    // Validate that the category type is supported
    if (!IsValidCategoryType(request.Type))
    {
      return BadRequest("Category type must be Expense, Savings, or Debt.");
    }

    // Prevent negative planned budget amounts
    if (request.PlannedAmount < 0)
    {
      return BadRequest("Planned amount cannot be negative.");
    }

    // Update the selected category
    var updatedCategory = await _categoryService.UpdateBudgetCategoryAsync(
      categoryId,
      request,
      userId);

    // Return 404 if the category does not exist
    // or does not belong to the current user
    if (updatedCategory == null)
    {
      return NotFound("Budget category not found.");
    }

    // Return the updated category
    return Ok(updatedCategory);
  }

  // ==========================================
  // DELETE: api/budget/categories/{categoryId}
  // Deletes an existing budget category.
  // ==========================================
  [HttpDelete("months/categories/{categoryId}")]
  public async Task<ActionResult<BudgetCategoryResponse>> DeleteBudgetCategory(
    string categoryId)
  {
    // Get the authenticated user's ID
    var userId = GetUserId();

    // Return 401 if the user is not authenticated
    if (userId == null)
    {
      return Unauthorized();
    }

    // Delete the selected category
    var deletedCategory = await _categoryService.DeleteBudgetCategoryAsync(
      categoryId,
      userId);

    // Return 404 if the category does not exist
    // or does not belong to the current user
    if (deletedCategory == null)
    {
      return NotFound("Budget category not found.");
    }

    // Return the deleted category
    return Ok(deletedCategory);
  }
}