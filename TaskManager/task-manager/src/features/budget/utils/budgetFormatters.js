/*===========================================================
  formatCurrency:
  => Formats numeric values as US currency.
===========================================================*/
export const formatCurrency = (
  value
) => {
  return new Intl.NumberFormat(
    'en-US',
    {
      style: 'currency',
      currency: 'USD',
    }
  ).format(
    Number(value ?? 0)
  );
};

/*===========================================================
  formatUtcDate:
  => Formats a UTC date without shifting the calendar day.

  Example:

  2026-08-15T00:00:00Z
  => Aug 15, 2026
===========================================================*/
export const formatUtcDate = (
  value,
  fallbackText = 'No date'
) => {
  if (!value) {
    return fallbackText;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return fallbackText;
  }

  return new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }
  ).format(date);
};