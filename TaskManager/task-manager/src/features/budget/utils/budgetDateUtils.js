/*===========================================================
  MONTH_NAMES:
  => Used when parsing Budget Month labels.

  Supports:
  => January 2026
  => Jan 2026
===========================================================*/
const MONTH_NAMES = [
  {
    full: 'january',
    short: 'jan',
  },
  {
    full: 'february',
    short: 'feb',
  },
  {
    full: 'march',
    short: 'mar',
  },
  {
    full: 'april',
    short: 'apr',
  },
  {
    full: 'may',
    short: 'may',
  },
  {
    full: 'june',
    short: 'jun',
  },
  {
    full: 'july',
    short: 'jul',
  },
  {
    full: 'august',
    short: 'aug',
  },
  {
    full: 'september',
    short: 'sep',
  },
  {
    full: 'october',
    short: 'oct',
  },
  {
    full: 'november',
    short: 'nov',
  },
  {
    full: 'december',
    short: 'dec',
  },
];

/*===========================================================
  formatLocalDateValue:
  => Converts local Date into YYYY-MM-DD.

  IMPORTANT:
  => Does not use toISOString().
  => Avoids UTC timezone shifting.
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
  => Returns date boundaries for numeric Month / Year.

  Example:
  => month = 9
  => year = 2026

  Returns:
  => minDate = 2026-09-01
  => maxDate = 2026-09-30
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

  const firstDate =
    new Date(
      normalizedYear,
      normalizedMonth - 1,
      1
    );

  const lastDate =
    new Date(
      normalizedYear,
      normalizedMonth,
      0
    );

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

/*===========================================================
  parseBudgetMonthLabel:
  => Converts a Budget Month label into numeric Month / Year.

  Supports:
  => September 2026
  => Sep 2026

  Does NOT depend on:
  => new Date("September 2026")
===========================================================*/
export const parseBudgetMonthLabel = (
  monthLabel
) => {
  if (
    typeof monthLabel !==
    'string' ||
    !monthLabel.trim()
  ) {
    return {
      month: null,
      year: null,
    };
  }

  const normalizedLabel =
    monthLabel
      .trim()
      .toLowerCase();

  const yearMatch =
    normalizedLabel.match(
      /\b(\d{4})\b/
    );

  if (!yearMatch) {
    return {
      month: null,
      year: null,
    };
  }

  const monthIndex =
    MONTH_NAMES.findIndex(
      (
        month
      ) =>
        normalizedLabel.includes(
          month.full
        ) ||
        normalizedLabel.includes(
          month.short
        )
    );

  if (
    monthIndex ===
    -1
  ) {
    return {
      month: null,
      year: null,
    };
  }

  return {
    month:
      monthIndex + 1,

    year:
      Number(
        yearMatch[1]
      ),
  };
};

/*===========================================================
  getBudgetMonthDateRangeFromLabel:
  => Convenience helper when only monthLabel is available.

  Example:
  => September 2026

  Returns:
  => 2026-09-01
  => 2026-09-30
===========================================================*/
export const getBudgetMonthDateRangeFromLabel = (
  monthLabel
) => {
  const {
    month,
    year,
  } =
    parseBudgetMonthLabel(
      monthLabel
    );

  return getBudgetMonthDateRange(
    month,
    year
  );
};