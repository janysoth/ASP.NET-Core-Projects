using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Mappers;

// Static helper class responsible for converting
// FinancialAccount models into FinancialAccountResponse DTOs.
public static class AccountMapper
{
  // Converts a FinancialAccount model into a response DTO.
  public static FinancialAccountResponse ToResponse(
    FinancialAccount account,
    decimal currentBalance)
  {
    // Create and return a response object
    return new FinancialAccountResponse
    {
      // Copy the account ID
      Id = account.Id,

      // Copy the account name
      Name = account.Name,

      // Copy the account type
      Type = account.Type,

      // Copy the original starting balance
      StartingBalance = account.StartingBalance,

      // Set the calculated current balance
      CurrentBalance = currentBalance,

      // Copy when the account was created
      CreatedAtUtc = account.CreatedAtUtc
    };
  }
}