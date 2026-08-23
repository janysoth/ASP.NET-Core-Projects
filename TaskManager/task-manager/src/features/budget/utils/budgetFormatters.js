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
  => Converts numeric month/year values into a readable label.

  Example:
  => month = 7
  => year  = 2026

  Result:
  => July 2026
===========================================================*/
export const formatBudgetMonth = (
  month,
  year
) => {
  const normalizedMonth =
    Number(
      month
    );

  const normalizedYear =
    Number(
      year
    );

  if (
    !Number.isInteger(
      normalizedMonth
    ) ||
    normalizedMonth < 1 ||
    normalizedMonth > 12 ||
    !Number.isInteger(
      normalizedYear
    )
  ) {
    return 'Unknown month';
  }

  return new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'long',
      year: 'numeric',
    }
  ).format(
    new Date(
      normalizedYear,
      normalizedMonth - 1,
      1
    )
  );
};