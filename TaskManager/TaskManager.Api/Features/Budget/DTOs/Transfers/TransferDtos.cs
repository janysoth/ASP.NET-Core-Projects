namespace TaskManager.Api.Features.Budget.DTOs.Transfers;

public sealed record CreateAccountTransferRequest
{
  public string FromAccountId { get; set; } =
    string.Empty;

  public string ToAccountId { get; set; } =
    string.Empty;

  // Optional.
  // Used when this transfer is a payment toward a bill.
  public string? BillId { get; set; }

  public decimal Amount { get; set; }

  public DateTime TransferDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record UpdateAccountTransferRequest
{
  public string FromAccountId { get; set; } = string.Empty;

  public string ToAccountId { get; set; } = string.Empty;

  public decimal Amount { get; set; }

  public DateTime TransferDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record PatchAccountTransferRequest
{
  public string? FromAccountId { get; set; }

  public string? ToAccountId { get; set; }

  /*
    BillId behavior:

    null
    => Do not change the existing BillId.

    Empty string
    => Remove the transfer from its current bill.

    A bill ID
    => Link the transfer to that Transfer bill.
  */
  public string? BillId { get; set; }

  public decimal? Amount { get; set; }

  public DateTime? TransferDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record AccountTransferResponse
{
  public string Id { get; set; } = string.Empty;

  public string FromAccountId { get; set; } =
    string.Empty;

  public string FromAccountName { get; set; } =
    string.Empty;

  public string ToAccountId { get; set; } =
    string.Empty;

  public string ToAccountName { get; set; } =
    string.Empty;

  public string? BillId { get; set; }

  public decimal Amount { get; set; }

  public DateTime TransferDate { get; set; }

  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; }
}