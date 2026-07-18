namespace TaskManager.Api.Features.Budget.Constants;

public static class FinancialAccountTypes
{
  public const string Checking = "Checking";

  public const string Savings = "Savings";

  public const string CreditCard = "CreditCard";

  public static readonly string[] All =
  [
    Checking,
    Savings,
    CreditCard
  ];

  /*===========================================================
    IsValid:
    => Checks whether a financial account type is supported.
    => Comparison is case-insensitive.
  ===========================================================*/
  public static bool IsValid(string? accountType)
  {
    return !string.IsNullOrWhiteSpace(accountType) &&
           All.Contains(
             accountType,
             StringComparer.OrdinalIgnoreCase);
  }

  /*===========================================================
    Normalize:
    => Converts a valid account type into its standard format.
    => Returns null when the value is invalid.
  ===========================================================*/
  public static string? Normalize(string? accountType)
  {
    if (string.Equals(
      accountType,
      Checking,
      StringComparison.OrdinalIgnoreCase))
    {
      return Checking;
    }

    if (string.Equals(
      accountType,
      Savings,
      StringComparison.OrdinalIgnoreCase))
    {
      return Savings;
    }

    if (string.Equals(
      accountType,
      CreditCard,
      StringComparison.OrdinalIgnoreCase))
    {
      return CreditCard;
    }

    return null;
  }
}