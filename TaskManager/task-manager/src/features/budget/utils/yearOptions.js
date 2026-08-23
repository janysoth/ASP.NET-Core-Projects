/*===========================================================
  createYearOptions:
  => Creates a reusable list of calendar years.

  Defaults:
  => 2 years before the current year.
  => 5 years after the current year.

  Example in 2026:
  => 2024 through 2031.
===========================================================*/
export const createYearOptions = ({
  yearsBefore = 2,
  yearsAfter = 5,
  currentYear =
  new Date().getFullYear(),
} = {}) => {
  const startYear =
    currentYear -
    yearsBefore;

  const endYear =
    currentYear +
    yearsAfter;

  return Array.from(
    {
      length:
        endYear -
        startYear +
        1,
    },
    (
      _,
      index
    ) => {
      const year =
        startYear +
        index;

      return {
        value: year,
        label:
          String(year),
      };
    }
  );
};