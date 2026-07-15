// using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Mappers;

public static class RecurringBillTemplateMapper
{
  /*===========================================================
    ToResponse:
    => Converts a recurring bill template model into a response DTO.
    => Keeps MongoDB fields separate from the public API response.
  ===========================================================*/
  public static RecurringBillTemplateResponse ToResponse(
    RecurringBillTemplate template)
  {
    return new RecurringBillTemplateResponse
    {
      Id = template.Id,
      Name = template.Name,
      CategoryName = template.CategoryName,
      CategoryType = template.CategoryType,
      ExpectedAmount = template.ExpectedAmount,
      DueDay = template.DueDay,
      IsActive = template.IsActive,
      Notes = template.Notes,
      CreatedAtUtc = template.CreatedAtUtc
    };
  }
}