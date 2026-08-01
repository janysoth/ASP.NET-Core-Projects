using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

[ApiController]
[Route("api/budget")]
public class BudgetCategoriesController
  : BudgetControllerBase
{
  private readonly BudgetCategoryService
    _categoryService;

  /*===========================================================
    BudgetCategoriesController Constructor:
    => Receives BudgetCategoryService from dependency injection.
  ===========================================================*/
  public BudgetCategoriesController(
    BudgetCategoryService categoryService)
  {
    _categoryService =
      categoryService;
  }

  /*===========================================================
    AddBudgetCategory:
    => Creates a category inside a budget month.
    => Requires Fixed or Variable for Expense categories.
    => Returns the newly created category.

    POST /api/budget/months/{budgetMonthId}/categories
  ===========================================================*/
  [HttpPost("months/{budgetMonthId}/categories")]
  public async Task<ActionResult<BudgetCategoryResponse>>
    AddBudgetCategory(
      string budgetMonthId,
      CreateBudgetCategoryRequest request)
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(
        budgetMonthId))
    {
      return BadRequest(
        new
        {
          message =
            "Budget month ID is required."
        });
    }

    if (string.IsNullOrWhiteSpace(
        request.Name))
    {
      return BadRequest(
        new
        {
          message =
            "Category name is required."
        });
    }

    if (!IsValidCategoryType(
        request.Type))
    {
      return BadRequest(
        new
        {
          message =
            "Category type must be Expense or Savings."
        });
    }

    var classificationError =
      ValidateCategoryClassification(
        request.Type,
        request.ExpenseType);

    if (classificationError is not null)
    {
      return BadRequest(
        new
        {
          message =
            classificationError
        });
    }

    if (request.PlannedAmount < 0)
    {
      return BadRequest(
        new
        {
          message =
            "Planned amount cannot be negative."
        });
    }

    var category =
      await _categoryService
        .AddBudgetCategoryAsync(
          budgetMonthId,
          request,
          userId);

    if (category is null)
    {
      return NotFound(
        new
        {
          message =
            "Budget month not found."
        });
    }

    return Ok(
      category);
  }

  /*===========================================================
    UpdateBudgetCategory:
    => Updates a budget category.
    => Validates its main type and expense classification.
    => Returns the updated category.

    PUT /api/budget/categories/{categoryId}
  ===========================================================*/
  [HttpPut("categories/{categoryId}")]
  public async Task<ActionResult<BudgetCategoryResponse>>
    UpdateBudgetCategory(
      string categoryId,
      UpdateBudgetCategoryRequest request)
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(
        categoryId))
    {
      return BadRequest(
        new
        {
          message =
            "Budget category ID is required."
        });
    }

    if (string.IsNullOrWhiteSpace(
        request.Name))
    {
      return BadRequest(
        new
        {
          message =
            "Category name is required."
        });
    }

    if (!IsValidCategoryType(
        request.Type))
    {
      return BadRequest(
        new
        {
          message =
            "Category type must be Expense or Savings."
        });
    }

    var classificationError =
      ValidateCategoryClassification(
        request.Type,
        request.ExpenseType);

    if (classificationError is not null)
    {
      return BadRequest(
        new
        {
          message =
            classificationError
        });
    }

    if (request.PlannedAmount < 0)
    {
      return BadRequest(
        new
        {
          message =
            "Planned amount cannot be negative."
        });
    }

    var updatedCategory =
      await _categoryService
        .UpdateBudgetCategoryAsync(
          categoryId,
          request,
          userId);

    if (updatedCategory is null)
    {
      return NotFound(
        new
        {
          message =
            "Budget category not found or could not be updated."
        });
    }

    return Ok(
      updatedCategory);
  }

  /*===========================================================
    DeleteBudgetCategory:
    => Deletes one budget category.
    => Returns the deleted category information.
    => Returns 409 Conflict when bills still reference it.

    DELETE /api/budget/categories/{categoryId}
  ===========================================================*/
  [HttpDelete("categories/{categoryId}")]
  public async Task<ActionResult<BudgetCategoryResponse>>
    DeleteBudgetCategory(
      string categoryId)
  {
    var userId =
      GetUserId();

    if (userId is null)
    {
      return Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(
        categoryId))
    {
      return BadRequest(
        new
        {
          message =
            "Budget category ID is required."
        });
    }

    try
    {
      var deletedCategory =
        await _categoryService
          .DeleteBudgetCategoryAsync(
            categoryId,
            userId);

      if (deletedCategory is null)
      {
        return NotFound(
          new
          {
            message =
              "Budget category not found."
          });
      }

      return Ok(
        deletedCategory);
    }
    catch (InvalidOperationException exception)
    {
      return Conflict(
        new
        {
          message =
            exception.Message
        });
    }
  }

}