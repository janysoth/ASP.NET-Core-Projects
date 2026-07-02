using TaskManager.Api.Features.Budget.DTOs;
using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Mappers;

public static class TransferMapper
{
  public static AccountTransferResponse ToResponse(AccountTransfer transfer)
  {
    return new AccountTransferResponse
    {
      Id = transfer.Id,
      FromAccountId = transfer.FromAccountId,
      ToAccountId = transfer.ToAccountId,
      Amount = transfer.Amount,
      TransferDate = transfer.TransferDate,
      Notes = transfer.Notes,
      CreatedAtUtc = transfer.CreatedAtUtc
    };
  }
}