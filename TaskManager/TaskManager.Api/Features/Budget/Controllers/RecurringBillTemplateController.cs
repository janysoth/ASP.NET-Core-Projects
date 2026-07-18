using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

[ApiController]
[Route("api/budget")]
public class RecurringBillTemplatesController
  : BudgetControllerBase
{
  private readonly RecurringBillTemplateService
    _templateService;

  public RecurringBillTemplatesController(
    RecurringBillTemplateService templateService)
  {
    _templateService = templateService;
  }

  /*===========================================================
    GetTemplates:
    => Gets all recurring bill templates for the logged-in user.
    => Returns active and inactive templates.
  ===========================================================*/
  [HttpGet("bill-templates")]
  public async Task<
    ActionResult<List<RecurringBillTemplateResponse>>>
    GetTemplates()
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var templates =
      await _templateService.GetTemplatesAsync(userId);

    return Ok(templates);
  }

  /*===========================================================
    GetTemplateById:
    => Gets one recurring bill template.
    => Returns 404 when it does not exist.
  ===========================================================*/
  [HttpGet("bill-templates/{templateId}")]
  public async Task<ActionResult<RecurringBillTemplateResponse>>
    GetTemplateById(string templateId)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var template =
      await _templateService.GetTemplateByIdAsync(
        templateId,
        userId);

    if (template == null)
    {
      return NotFound("Recurring bill template not found.");
    }

    return Ok(template);
  }

  /*===========================================================
    CreateTemplate:
    => Creates a recurring monthly bill template.
    => Validates name, category, amount, type, and due day.
  ===========================================================*/
  [HttpPost("bill-templates")]
  public async Task<ActionResult<RecurringBillTemplateResponse>>
    CreateTemplate(
      CreateRecurringBillTemplateRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var validationError = ValidateTemplate(
      request.Name,
      request.CategoryName,
      request.CategoryType,
      request.ExpectedAmount,
      request.DueDay);

    if (validationError != null)
    {
      return BadRequest(validationError);
    }

    var template =
      await _templateService.CreateTemplateAsync(
        request,
        userId);

    return CreatedAtAction(
      nameof(GetTemplateById),
      new { templateId = template.Id },
      template);
  }

  /*===========================================================
    UpdateTemplate:
    => Updates a recurring monthly bill template.
    => Already-generated bills are not changed.
  ===========================================================*/
  [HttpPut("bill-templates/{templateId}")]
  public async Task<ActionResult<RecurringBillTemplateResponse>>
    UpdateTemplate(
      string templateId,
      UpdateRecurringBillTemplateRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var validationError = ValidateTemplate(
      request.Name,
      request.CategoryName,
      request.CategoryType,
      request.ExpectedAmount,
      request.DueDay);

    if (validationError != null)
    {
      return BadRequest(validationError);
    }

    var template =
      await _templateService.UpdateTemplateAsync(
        templateId,
        request,
        userId);

    if (template == null)
    {
      return NotFound("Recurring bill template not found.");
    }

    return Ok(template);
  }

  /*===========================================================
    DeleteTemplate:
    => Deletes a recurring bill template.
    => Previously-generated monthly bills remain unchanged.
    => Returns the deleted template.
  ===========================================================*/
  [HttpDelete("bill-templates/{templateId}")]
  public async Task<ActionResult<RecurringBillTemplateResponse>>
    DeleteTemplate(string templateId)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var template =
      await _templateService.DeleteTemplateAsync(
        templateId,
        userId);

    if (template == null)
    {
      return NotFound("Recurring bill template not found.");
    }

    return Ok(template);
  }

  /*===========================================================
    GenerateBills:
    => Creates monthly bills from all active templates.
    => Uses an explicit target month and year.
    => Skips duplicate bills and missing categories.
  ===========================================================*/
  [HttpPost("bills/generate")]
  public async Task<ActionResult<GenerateBillsResponse>>
    GenerateBills(GenerateBillsRequest request)
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (request.Month < 1 || request.Month > 12)
    {
      return BadRequest(
        "Month must be between 1 and 12.");
    }

    if (request.Year < 2000)
    {
      return BadRequest("Year is invalid.");
    }

    var result =
      await _templateService.GenerateBillsAsync(
        request,
        userId);

    if (result == null)
    {
      return NotFound(
        "The target budget month does not exist.");
    }

    return Ok(result);
  }

  /*===========================================================
    ValidateTemplate:
    => Validates recurring bill template values.
    => Returns null when the request is valid.
  ===========================================================*/
  private static string? ValidateTemplate(
    string name,
    string categoryName,
    string categoryType,
    decimal expectedAmount,
    int dueDay)
  {
    if (string.IsNullOrWhiteSpace(name))
    {
      return "Template name is required.";
    }

    if (string.IsNullOrWhiteSpace(categoryName))
    {
      return "Category name is required.";
    }

    if (!string.Equals(
      categoryType,
      BudgetCategoryTypes.Expense,
      StringComparison.OrdinalIgnoreCase))
    {
      return "Recurring bill templates must use an Expense category.";
    }

    if (expectedAmount <= 0)
    {
      return "Expected amount must be greater than 0.";
    }

    if (dueDay < 1 || dueDay > 31)
    {
      return "Due day must be between 1 and 31.";
    }

    return null;
  }
}