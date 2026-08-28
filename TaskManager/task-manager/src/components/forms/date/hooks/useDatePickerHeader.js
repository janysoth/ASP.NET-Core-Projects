import {
  useMemo,
} from 'react';

import {
  MONTH_OPTIONS,
  createYearOptions,
} from '@/features/budget/utils';

/*===========================================================
  useDatePickerHeader:
  => Owns Date Picker header state derivation and navigation.

  Handles:
  => Current visible month.
  => Selected month number.
  => Selected year.
  => Month options.
  => Year options.
  => Previous month.
  => Next month.
  => Month selection.
  => Year selection.
  => Min / max navigation restrictions.

  Year Range:
  => 5 years before selected year.
  => 5 years after selected year.
===========================================================*/
const useDatePickerHeader = ({
  month,
  onMonthChange,

  minDate = null,
  maxDate = null,
}) => {
  /*===========================================================
    Current Month
  ===========================================================*/
  const currentMonth =
    month instanceof Date
      ? month
      : new Date();

  const selectedMonth =
    currentMonth.getMonth() +
    1;

  const selectedYear =
    currentMonth.getFullYear();

  /*===========================================================
    Month Options
  ===========================================================*/
  const monthOptions =
    MONTH_OPTIONS;

  /*===========================================================
    Year Options
  ===========================================================*/
  const yearOptions =
    useMemo(
      () =>
        createYearOptions({
          currentYear:
            selectedYear,
          yearsBefore: 5,
          yearsAfter: 5,
        }),
      [
        selectedYear,
      ]
    );

  /*===========================================================
    Previous Month
  ===========================================================*/
  const previousMonth =
    useMemo(
      () =>
        new Date(
          selectedYear,
          selectedMonth - 2,
          1
        ),
      [
        selectedMonth,
        selectedYear,
      ]
    );

  /*===========================================================
    Next Month
  ===========================================================*/
  const nextMonth =
    useMemo(
      () =>
        new Date(
          selectedYear,
          selectedMonth,
          1
        ),
      [
        selectedMonth,
        selectedYear,
      ]
    );

  /*===========================================================
    Minimum Month
  ===========================================================*/
  const minimumMonth =
    useMemo(
      () =>
        minDate
          ? new Date(
            minDate.getFullYear(),
            minDate.getMonth(),
            1
          )
          : null,
      [
        minDate,
      ]
    );

  /*===========================================================
    Maximum Month
  ===========================================================*/
  const maximumMonth =
    useMemo(
      () =>
        maxDate
          ? new Date(
            maxDate.getFullYear(),
            maxDate.getMonth(),
            1
          )
          : null,
      [
        maxDate,
      ]
    );

  /*===========================================================
    Previous Disabled
  ===========================================================*/
  const previousDisabled =
    Boolean(
      minimumMonth &&
      previousMonth <
      minimumMonth
    );

  /*===========================================================
    Next Disabled
  ===========================================================*/
  const nextDisabled =
    Boolean(
      maximumMonth &&
      nextMonth >
      maximumMonth
    );

  /*===========================================================
    Change Month
  ===========================================================*/
  const handleMonthChange = (
    nextMonthValue
  ) => {
    const nextDate =
      new Date(
        selectedYear,
        Number(
          nextMonthValue
        ) - 1,
        1
      );

    onMonthChange?.(
      nextDate
    );
  };

  /*===========================================================
    Change Year
  ===========================================================*/
  const handleYearChange = (
    nextYearValue
  ) => {
    const nextDate =
      new Date(
        Number(
          nextYearValue
        ),
        selectedMonth - 1,
        1
      );

    onMonthChange?.(
      nextDate
    );
  };

  /*===========================================================
    Go To Previous Month
  ===========================================================*/
  const handlePreviousMonth =
    () => {
      if (
        previousDisabled
      ) {
        return;
      }

      onMonthChange?.(
        previousMonth
      );
    };

  /*===========================================================
    Go To Next Month
  ===========================================================*/
  const handleNextMonth =
    () => {
      if (
        nextDisabled
      ) {
        return;
      }

      onMonthChange?.(
        nextMonth
      );
    };

  return {
    selectedMonth,
    selectedYear,

    monthOptions,
    yearOptions,

    previousDisabled,
    nextDisabled,

    handleMonthChange,
    handleYearChange,

    handlePreviousMonth,
    handleNextMonth,
  };
};

export default useDatePickerHeader;