using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Features.Budget.Services;

namespace TaskManager.Api.Features.Budget.Controllers;

[ApiController]
[Route("api/budget")]
public class RecurringBillTemplateController : BudgetControllerBase
{
  private readonly RecurringBillTemplateService _templateService;

  /*===========================================================
    RecurringBillTemplateController Constructor:
    => Receives RecurringBillTemplateService through
       dependency injection.
  ===========================================================*/
  public RecurringBillTemplateController(
    RecurringBillTemplateService templateService)
  {
    _templateService = templateService;
  }

  /*===========================================================
    GetTemplates:
    => Gets all recurring Fixed Expense bill templates
       for the logged-in user.
  ===========================================================*/
  [HttpGet("bill-templates")]
  public async Task<ActionResult<List<RecurringBillTemplateResponse>>>
    GetTemplates()
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var templates =
      await _templateService.GetTemplatesAsync(
        userId);

    return Ok(
      templates);
  }

  /*===========================================================
    GetTemplateById:
    => Gets one recurring bill template by ID.
    => Returns 404 when the template does not exist.
  ===========================================================*/
  [HttpGet("bill-templates/{templateId}")]
  public async Task<ActionResult<RecurringBillTemplateResponse>>
    GetTemplateById(
      string templateId)
  {
    var userId =
      GetUserId();

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
      return NotFound(
        "Recurring bill template not found.");
    }

    return Ok(
      template);
  }

  /*===========================================================
    CreateTemplate:
    => Creates a recurring Fixed Expense bill template.

    Required:
    => CategoryName
    => Name
    => ExpectedAmount greater than 0
    => DueDay between 1 and 31
  ===========================================================*/
  [HttpPost("bill-templates")]
  public async Task<ActionResult<RecurringBillTemplateResponse>>
    CreateTemplate(
      CreateRecurringBillTemplateRequest request)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var validationError =
      ValidateTemplate(
        request.CategoryName,
        request.Name,
        request.ExpectedAmount,
        request.DueDay);

    if (validationError != null)
    {
      return BadRequest(
        validationError);
    }

    var template =
      await _templateService.CreateTemplateAsync(
        request,
        userId);

    if (template == null)
    {
      return BadRequest(
        "The recurring bill template could not be created.");
    }

    return CreatedAtAction(
      nameof(GetTemplateById),
      new
      {
        templateId = template.Id
      },
      template);
  }

  /*===========================================================
    UpdateTemplate:
    => Updates an existing recurring Fixed Expense template.
    => Already-generated bills are not changed.
  ===========================================================*/
  [HttpPut("bill-templates/{templateId}")]
  public async Task<ActionResult<RecurringBillTemplateResponse>>
    UpdateTemplate(
      string templateId,
      UpdateRecurringBillTemplateRequest request)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var validationError =
      ValidateTemplate(
        request.CategoryName,
        request.Name,
        request.ExpectedAmount,
        request.DueDay);

    if (validationError != null)
    {
      return BadRequest(
        validationError);
    }

    var template =
      await _templateService.UpdateTemplateAsync(
        templateId,
        request,
        userId);

    if (template == null)
    {
      return BadRequest(
        "The recurring bill template could not be updated. Check the template ID and template values.");
    }

    return Ok(
      template);
  }

  /*===========================================================
    DeleteTemplate:
    => Deletes one recurring bill template.
    => Previously-generated bills remain unchanged.
    => Returns the deleted template information.
  ===========================================================*/
  [HttpDelete("bill-templates/{templateId}")]
  public async Task<ActionResult<RecurringBillTemplateResponse>>
    DeleteTemplate(
      string templateId)
  {
    var userId =
      GetUserId();

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
      return NotFound(
        "Recurring bill template not found.");
    }

    return Ok(
      template);
  }

  /*===========================================================
    GenerateBills:
    => Generates Fixed Expense bills from all active
       recurring templates.
    => Duplicate bills are skipped.
  ===========================================================*/
  [HttpPost("bills/generate")]
  public async Task<ActionResult<GenerateBillsResponse>>
    GenerateBills(
      GenerateBillsRequest request)
  {
    var userId =
      GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    if (request.Month < 1 ||
        request.Month > 12)
    {
      return BadRequest(
        "Month must be between 1 and 12.");
    }

    if (request.Year < 2000)
    {
      return BadRequest(
        "Year is invalid.");
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

    return Ok(
      result);
  }

  /*===========================================================
    ValidateTemplate:
    => Validates a recurring Fixed Expense bill template.
    => Returns an error message or null when valid.
  ===========================================================*/
  private static string? ValidateTemplate(
    string? categoryName,
    string? name,
    decimal expectedAmount,
    int dueDay)
  {
    if (string.IsNullOrWhiteSpace(
      categoryName))
    {
      return
        "Category name is required.";
    }

    if (string.IsNullOrWhiteSpace(
      name))
    {
      return
        "Template name is required.";
    }

    if (expectedAmount <= 0)
    {
      return
        "Expected amount must be greater than 0.";
    }

    if (dueDay < 1 ||
        dueDay > 31)
    {
      return
        "Due day must be between 1 and 31.";
    }

    return null;
  }
}