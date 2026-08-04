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

/*===========================================================
  formatBudgetMonth:
  => Converts numeric month and year values into a readable
     month label.

  Example:
  7, 2026 => July 2026
===========================================================*/
export const formatBudgetMonth = (
  month,
  year,
  fallbackText = 'Unknown month'
) => {
  if (!month || !year) {
    return fallbackText;
  }

  const date =
    new Date(
      year,
      month - 1,
      1
    );

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
      month: 'long',
      year: 'numeric',
    }
  ).format(date);
};