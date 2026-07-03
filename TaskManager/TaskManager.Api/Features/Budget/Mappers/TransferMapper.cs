using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Mappers;

// Static helper class responsible for converting
// AccountTransfer models into AccountTransferResponse DTOs.
public static class TransferMapper
{
  // Converts an AccountTransfer model into a response DTO.
  public static AccountTransferResponse ToResponse(AccountTransfer transfer)
  {
    // Create and return a response object
    return new AccountTransferResponse
    {
      // Copy the transfer ID
      Id = transfer.Id,

      // Copy the account ID where the money was transferred from
      FromAccountId = transfer.FromAccountId,

      // Copy the account ID where the money was transferred to
      ToAccountId = transfer.ToAccountId,

      // Copy the transfer amount
      Amount = transfer.Amount,

      // Copy the date the transfer occurred
      TransferDate = transfer.TransferDate,

      // Copy any optional notes
      Notes = transfer.Notes,

      // Copy when the transfer record was created
      CreatedAtUtc = transfer.CreatedAtUtc
    };
  }
}