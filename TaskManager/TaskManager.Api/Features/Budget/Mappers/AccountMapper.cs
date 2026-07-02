using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Mappers;

public static class AccountMapper
{
  public static FinancialAccountResponse ToResponse(
    FinancialAccount account,
    decimal currentBalance)
  {
    return new FinancialAccountResponse
    {
      Id = account.Id,
      Name = account.Name,
      Type = account.Type,
      StartingBalance = account.StartingBalance,
      CurrentBalance = currentBalance,
      CreatedAtUtc = account.CreatedAtUtc
    };
  }
}