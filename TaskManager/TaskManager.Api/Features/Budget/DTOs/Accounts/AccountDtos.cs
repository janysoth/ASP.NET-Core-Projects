namespace TaskManager.Api.Features.Budget.DTOs.Accounts;

public sealed record CreateFinancialAccountRequest
{
  public string Name { get; set; } = string.Empty;

  public string Type { get; set; } = FinancialAccountTypes.Checking;

  public decimal StartingBalance { get; set; }
}

public sealed record UpdateFinancialAccountRequest
{
  public string Name { get; set; } = string.Empty;

  public string Type { get; set; } = FinancialAccountTypes.Checking;

  public decimal StartingBalance { get; set; }
}

public sealed record FinancialAccountResponse
{
  public string Id { get; set; } = string.Empty;

  public string Name { get; set; } = string.Empty;

  public string Type { get; set; } = string.Empty;

  public decimal StartingBalance { get; set; }

  public decimal CurrentBalance { get; set; }

  public DateTime CreatedAtUtc { get; set; }
}