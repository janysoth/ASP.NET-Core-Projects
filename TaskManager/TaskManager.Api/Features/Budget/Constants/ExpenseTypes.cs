namespace TaskManager.Api.Features.Budget.Constants;

public static class ExpenseTypes
{
  public const string Fixed = "Fixed";

  public const string Variable = "Variable";

  public static readonly string[] All =
  [
    Fixed,
    Variable
  ];

  /*===========================================================
    IsValid:
    => Checks whether an expense classification is supported.
    => Comparison is case-insensitive.
  ===========================================================*/
  public static bool IsValid(string? expenseType)
  {
    return !string.IsNullOrWhiteSpace(expenseType) &&
           All.Contains(
             expenseType,
             StringComparer.OrdinalIgnoreCase);
  }

  /*===========================================================
    Normalize:
    => Converts a valid expense classification into its
       standard stored value.
    => Returns null when the value is invalid.
  ===========================================================*/
  public static string? Normalize(string? expenseType)
  {
    if (string.Equals(
      expenseType,
      Fixed,
      StringComparison.OrdinalIgnoreCase))
    {
      return Fixed;
    }

    if (string.Equals(
      expenseType,
      Variable,
      StringComparison.OrdinalIgnoreCase))
    {
      return Variable;
    }

    return null;
  }
}