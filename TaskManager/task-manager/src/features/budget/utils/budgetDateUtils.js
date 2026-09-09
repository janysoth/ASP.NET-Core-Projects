/*===========================================================
  formatLocalDateValue:
  => Converts a local Date into YYYY-MM-DD.

  IMPORTANT:
  => Does not use toISOString().
  => Avoids UTC timezone date shifting.
===========================================================*/
export const formatLocalDateValue = (
  date
) => {
  if (
    !(date instanceof Date) ||
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    );

  return `${year}-${month}-${day}`;
};

/*===========================================================
  getBudgetMonthDateRange:
  => Returns the first and last dates for a Budget Month.

  Example:
  => month = 9
  => year = 2026

  Returns:
  => minDate = 2026-09-01
  => maxDate = 2026-09-30
  => defaultDate = appropriate date inside September

  Default Date:
  => Uses today's day number when possible.
  => Clamps to the final day of the selected month.
===========================================================*/
export const getBudgetMonthDateRange = (
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
    return {
      minDate: '',
      maxDate: '',
      defaultDate: '',
    };
  }

  /*===========================================================
    First Day
  ===========================================================*/
  const firstDate =
    new Date(
      normalizedYear,
      normalizedMonth - 1,
      1
    );

  /*===========================================================
    Last Day:
    => Day 0 of following month gives final day of target month.
  ===========================================================*/
  const lastDate =
    new Date(
      normalizedYear,
      normalizedMonth,
      0
    );

  /*===========================================================
    Suggested Default Day
  ===========================================================*/
  const today =
    new Date();

  const defaultDay =
    Math.min(
      today.getDate(),
      lastDate.getDate()
    );

  const defaultDate =
    new Date(
      normalizedYear,
      normalizedMonth - 1,
      defaultDay
    );

  return {
    minDate:
      formatLocalDateValue(
        firstDate
      ),

    maxDate:
      formatLocalDateValue(
        lastDate
      ),

    defaultDate:
      formatLocalDateValue(
        defaultDate
      ),
  };
};