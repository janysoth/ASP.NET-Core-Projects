using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Mappers;

public static class IncomeMapper
{
  public static IncomeResponse ToResponse(IncomeRecord income)
  {
    return new IncomeResponse
    {
      Id = income.Id,
      BudgetMonthId = income.BudgetMonthId,
      AccountId = income.AccountId,
      Source = income.Source,
      Amount = income.Amount,
      IncomeDate = income.IncomeDate,
      Notes = income.Notes,
      CreatedAtUtc = income.CreatedAtUtc
    };
  }
}