/*===========================================================
  MONTH_NAMES_SHORT:
  => Used for displaying dates.

  Example:

  Aug 28, 2026
===========================================================*/
export const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/*===========================================================
  padNumber:
===========================================================*/
const padNumber = (
  value
) =>
  String(value).padStart(
    2,
    '0'
  );

/*===========================================================
  isValidDate:
===========================================================*/
export const isValidDate = (
  date
) => {
  return (
    date instanceof Date &&
    !Number.isNaN(
      date.getTime()
    )
  );
};

/*===========================================================
  formatApiDate:
  => Converts Date into YYYY-MM-DD.

  Example:

  Date

  →

  2026-08-28
===========================================================*/
export const formatApiDate = (
  date
) => {
  if (
    !isValidDate(date)
  ) {
    return '';
  }

  return `${date.getFullYear()}-${padNumber(
    date.getMonth() + 1
  )}-${padNumber(
    date.getDate()
  )}`;
};

/*===========================================================
  formatDisplayDate:
  => Converts Date into:

  Aug 28, 2026
===========================================================*/
export const formatDisplayDate =
  (
    date
  ) => {
    if (
      !isValidDate(
        date
      )
    ) {
      return '';
    }

    return `${MONTH_NAMES_SHORT[
      date.getMonth()
      ]
      } ${date.getDate()}, ${date.getFullYear()}`;
  };

/*===========================================================
  parseApiDate:

  YYYY-MM-DD

  →

  Date
===========================================================*/
export const parseApiDate =
  (
    value
  ) => {
    if (
      !value
    ) {
      return null;
    }

    const match =
      value.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
      );

    if (
      !match
    ) {
      return null;
    }

    const year =
      Number(
        match[1]
      );

    const month =
      Number(
        match[2]
      );

    const day =
      Number(
        match[3]
      );

    const date =
      new Date(
        year,
        month - 1,
        day
      );

    if (
      date.getFullYear() !==
      year
    ) {
      return null;
    }

    if (
      date.getMonth() !==
      month - 1
    ) {
      return null;
    }

    if (
      date.getDate() !==
      day
    ) {
      return null;
    }

    return date;
  };

/*===========================================================
  parseManualDate

  Supports:

  8/28

  08/28

  8/28/26

  8/28/2026

  Missing year:

  Uses current year.
===========================================================*/
export const parseManualDate =
  (
    value
  ) => {
    if (
      !value
    ) {
      return null;
    }

    const trimmed =
      value.trim();

    const match =
      trimmed.match(
        /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/
      );

    if (
      !match
    ) {
      return null;
    }

    const month =
      Number(
        match[1]
      );

    const day =
      Number(
        match[2]
      );

    let year;

    if (
      !match[3]
    ) {
      year =
        new Date().getFullYear();
    } else if (
      match[3].length ===
      2
    ) {
      year =
        2000 +
        Number(
          match[3]
        );
    } else {
      year =
        Number(
          match[3]
        );
    }

    const date =
      new Date(
        year,
        month - 1,
        day
      );

    if (
      date.getFullYear() !==
      year
    ) {
      return null;
    }

    if (
      date.getMonth() !==
      month - 1
    ) {
      return null;
    }

    if (
      date.getDate() !==
      day
    ) {
      return null;
    }

    return date;
  };

/*===========================================================
  clampDate:

  Keeps a date inside min/max.
===========================================================*/
export const clampDate =
  (
    date,
    minDate,
    maxDate
  ) => {
    if (
      !isValidDate(
        date
      )
    ) {
      return null;
    }

    if (
      minDate &&
      date <
      minDate
    ) {
      return minDate;
    }

    if (
      maxDate &&
      date >
      maxDate
    ) {
      return maxDate;
    }

    return date;
  };