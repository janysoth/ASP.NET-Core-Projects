namespace TaskManager.Api.Features.Budget.Constants;

public static class BillPaymentTypes
{
  public const string Expense = "Expense";

  public const string Transfer = "Transfer";

  public static readonly string[] All =
  [
    Expense,
    Transfer
  ];

  /*===========================================================
    IsValid:
    => Checks whether a bill payment type is supported.
    => Allowed values are Expense and Transfer.
  ===========================================================*/
  public static bool IsValid(string? paymentType)
  {
    return !string.IsNullOrWhiteSpace(paymentType) &&
           All.Contains(
             paymentType,
             StringComparer.OrdinalIgnoreCase);
  }

  /*===========================================================
    Normalize:
    => Converts a valid payment type into its standard format.
    => Returns null when the value is invalid.
  ===========================================================*/
  public static string? Normalize(string? paymentType)
  {
    if (string.Equals(
      paymentType,
      Expense,
      StringComparison.OrdinalIgnoreCase))
    {
      return Expense;
    }

    if (string.Equals(
      paymentType,
      Transfer,
      StringComparison.OrdinalIgnoreCase))
    {
      return Transfer;
    }

    return null;
  }
}