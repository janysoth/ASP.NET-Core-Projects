using TaskManager.Api.Features.Budget.Models;

namespace TaskManager.Api.Features.Budget.Mappers;

public static class TransferMapper
{
  /*===========================================================
    ToResponse:
    => Converts an AccountTransfer into a response DTO.
    => Includes source and destination account names.
    => Includes optional BillId when linked to a bill.
  ===========================================================*/
  public static AccountTransferResponse ToResponse(
    AccountTransfer transfer,
    FinancialAccount? fromAccount = null,
    FinancialAccount? toAccount = null)
  {
    return new AccountTransferResponse
    {
      Id = transfer.Id,

      FromAccountId =
        transfer.FromAccountId,

      FromAccountName =
        fromAccount?.Name ??
        string.Empty,

      ToAccountId =
        transfer.ToAccountId,

      ToAccountName =
        toAccount?.Name ??
        string.Empty,

      BillId =
        transfer.BillId,

      Amount =
        transfer.Amount,

      TransferDate =
        transfer.TransferDate,

      Notes =
        transfer.Notes,

      CreatedAtUtc =
        transfer.CreatedAtUtc
    };
  }
}