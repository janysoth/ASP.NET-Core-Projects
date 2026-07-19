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
    => Gets all recurring bill templates for the logged-in user.
    => Returns both Expense and Transfer templates.
  ===========================================================*/
  [HttpGet("bill-templates")]
  public async Task<ActionResult<List<RecurringBillTemplateResponse>>>
    GetTemplates()
  {
    var userId = GetUserId();

    if (userId == null)
    {
      return Unauthorized();
    }

    var templates =
      await _templateService.GetTemplatesAsync(
        userId);

    return Ok(templates);
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
      return NotFound(
        "Recurring bill template not found.");
    }

    return Ok(template);
  }

  /*===========================================================
    CreateTemplate:
    => Creates an Expense or Transfer recurring bill template.
    => Expense templates require a category name.
    => Transfer templates require a CreditCard destination.
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

    var validationError =
      ValidateTemplate(
        request.PaymentType,
        request.CategoryName,
        request.DestinationAccountId,
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
        "The recurring bill template could not be created. Transfer templates must use a valid CreditCard destination account.");
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
    => Updates an existing recurring bill template.
    => Expense and Transfer templates use different
       validation rules.
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

    var validationError =
      ValidateTemplate(
        request.PaymentType,
        request.CategoryName,
        request.DestinationAccountId,
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
        "The recurring bill template could not be updated. Check the template ID, payment type, or destination CreditCard account.");
    }

    return Ok(template);
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
      return NotFound(
        "Recurring bill template not found.");
    }

    return Ok(template);
  }

  /*===========================================================
    GenerateBills:
    => Generates bills from all active recurring templates.
    => Expense templates generate Expense bills.
    => Transfer templates generate credit-card payment bills.
    => Duplicate bills are skipped.
  ===========================================================*/
  [HttpPost("bills/generate")]
  public async Task<ActionResult<GenerateBillsResponse>>
    GenerateBills(
      GenerateBillsRequest request)
  {
    var userId = GetUserId();

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

    return Ok(result);
  }

  /*===========================================================
    ValidateTemplate:
    => Validates Expense and Transfer recurring templates.
    => Uses nullable-safe string checks.
    => Expense requires CategoryName.
    => Transfer requires DestinationAccountId.
    => Returns an error message or null when valid.
  ===========================================================*/
  private static string? ValidateTemplate(
    string? paymentType,
    string? categoryName,
    string? destinationAccountId,
    string? name,
    decimal expectedAmount,
    int dueDay)
  {
    /*
      Validate the main payment type first.

      BillPaymentTypes.IsValid accepts a nullable string,
      so this check is safe even when paymentType is null.
    */
    if (!BillPaymentTypes.IsValid(
      paymentType))
    {
      return
        "Payment type must be Expense or Transfer.";
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

    /*
      Expense Template:

      Required:
      CategoryName

      Must be empty:
      DestinationAccountId
    */
    if (string.Equals(
      paymentType,
      BillPaymentTypes.Expense,
      StringComparison.OrdinalIgnoreCase))
    {
      if (string.IsNullOrWhiteSpace(
        categoryName))
      {
        return
          "Category name is required for an Expense template.";
      }

      if (!string.IsNullOrWhiteSpace(
        destinationAccountId))
      {
        return
          "Destination account must be empty for an Expense template.";
      }
    }

    /*
      Transfer Template:

      Required:
      DestinationAccountId

      Must be empty:
      CategoryName
    */
    if (string.Equals(
      paymentType,
      BillPaymentTypes.Transfer,
      StringComparison.OrdinalIgnoreCase))
    {
      if (string.IsNullOrWhiteSpace(
        destinationAccountId))
      {
        return
          "Destination CreditCard account is required for a Transfer template.";
      }

      if (!string.IsNullOrWhiteSpace(
        categoryName))
      {
        return
          "Category name must be empty for a Transfer template.";
      }
    }

    return null;
  }
}