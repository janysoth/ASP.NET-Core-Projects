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
      POST: /api/budget/bill-templates

      => Creates a recurring bill template.
      => Returns 201 Created when successful.
      => Returns 400 Bad Request when validation fails.
      => Returns 409 Conflict when a duplicate template exists.
    ===========================================================*/
  [HttpPost("bill-templates")]
  public async Task<ActionResult<RecurringBillTemplateResponse>>
    CreateTemplate(
      CreateRecurringBillTemplateRequest request)
  {
    /*
      Get the logged-in user's ID from the JWT token.
    */
    var userId =
      GetUserId();

    /*
      Reject the request when the token does not contain
      a valid user ID.
    */
    if (userId == null)
    {
      return Unauthorized();
    }

    /*
      Validate the request before sending it to the service.

      This checks values such as:

      - Category name
      - Bill name
      - Expected amount
      - Due day
    */
    var validationError =
      ValidateTemplate(
        request.CategoryName,
        request.Name,
        request.ExpectedAmount,
        request.DueDay);

    /*
      Return 400 Bad Request when the request values
      are invalid.
    */
    if (validationError != null)
    {
      return BadRequest(
        new
        {
          message = validationError
        });
    }

    try
    {
      /*
        Ask the service to create the recurring template.

        The service also checks whether a duplicate
        template already exists.
      */
      var template =
        await _templateService.CreateTemplateAsync(
          request,
          userId);

      /*
        Protect against an unexpected null result.
      */
      if (template == null)
      {
        return BadRequest(
          new
          {
            message =
              "The recurring bill template could not be created."
          });
      }

      /*
        Return 201 Created and include the new template
        in the response body.
      */
      return CreatedAtAction(
        nameof(GetTemplateById),
        new
        {
          templateId = template.Id
        },
        template);
    }
    catch (InvalidOperationException exception)
    {
      /*
        A duplicate template conflicts with existing data.

        Return 409 Conflict instead of exposing an
        unhandled exception and stack trace.
      */
      return Conflict(
        new
        {
          message = exception.Message
        });
    }
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