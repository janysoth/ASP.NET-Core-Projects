namespace TaskManager.Api.Features.Budget.DTOs.Transfers;

public sealed record CreateAccountTransferRequest
{
  /*===========================================================
    FromAccountId:
    => Account the money is leaving.

    Examples:

    Checking
    Savings
  ===========================================================*/
  public string FromAccountId { get; set; } =
    string.Empty;

  /*===========================================================
    ToAccountId:
    => Account receiving the money.

    Examples:

    Savings
    Checking
    CreditCard
  ===========================================================*/
  public string ToAccountId { get; set; } =
    string.Empty;

  /*===========================================================
    Amount:
    => Amount of money being moved.
    => Must be greater than zero.
  ===========================================================*/
  public decimal Amount { get; set; }

  /*===========================================================
    TransferDate:
    => Date the money actually moved.
    => Future-dated transfers are not allowed.
  ===========================================================*/
  public DateTime TransferDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record UpdateAccountTransferRequest
{
  public string FromAccountId { get; set; } =
    string.Empty;

  public string ToAccountId { get; set; } =
    string.Empty;

  public decimal Amount { get; set; }

  public DateTime TransferDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record PatchAccountTransferRequest
{
  /*===========================================================
    Nullable properties:
    => null means keep the existing value.
  ===========================================================*/
  public string? FromAccountId { get; set; }

  public string? ToAccountId { get; set; }

  public decimal? Amount { get; set; }

  public DateTime? TransferDate { get; set; }

  public string? Notes { get; set; }
}

public sealed record AccountTransferResponse
{
  public string Id { get; set; } =
    string.Empty;

  public string FromAccountId { get; set; } =
    string.Empty;

  public string FromAccountName { get; set; } =
    string.Empty;

  public string ToAccountId { get; set; } =
    string.Empty;

  public string ToAccountName { get; set; } =
    string.Empty;

  public decimal Amount { get; set; }

  public DateTime TransferDate { get; set; }

  public string? Notes { get; set; }

  public DateTime CreatedAtUtc { get; set; }
}