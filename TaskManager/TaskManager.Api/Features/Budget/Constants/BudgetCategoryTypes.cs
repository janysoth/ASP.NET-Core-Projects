namespace TaskManager.Api.Features.Budget.Constants;

public static class BudgetCategoryTypes
{
  public const string Expense = "Expense";

  public const string Savings = "Savings";

  public static readonly string[] All =
  [
    Expense,
    Savings
  ];

  /*===========================================================
    IsValid:
    => Checks whether a category type is supported.
    => Comparison is case-insensitive.
  ===========================================================*/
  public static bool IsValid(string? type)
  {
    return !string.IsNullOrWhiteSpace(type) &&
           All.Contains(
             type,
             StringComparer.OrdinalIgnoreCase);
  }

  /*===========================================================
    Normalize:
    => Converts a valid category type into its standard format.
    => Returns null when the value is invalid.
  ===========================================================*/
  public static string? Normalize(string? type)
  {
    if (string.Equals(
      type,
      Expense,
      StringComparison.OrdinalIgnoreCase))
    {
      return Expense;
    }

    if (string.Equals(
      type,
      Savings,
      StringComparison.OrdinalIgnoreCase))
    {
      return Savings;
    }

    return null;
  }
}