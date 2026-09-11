import React, {
  useMemo,
} from 'react';

import {
  MONTH_OPTIONS,
  createYearOptions,
} from '@/features/budget/utils';

import DatePickerHeaderNavButton from './DatePickerHeaderNavButton';

import DatePickerHeaderSelectors from './DatePickerHeaderSelectors';

/*===========================================================
  DatePickerHeader:
  => Header for the shared Date Picker.

  Handles:
  => Previous month.
  => Next month.
  => Month selection.
  => Year selection.
  => Minimum / maximum month boundaries.
  => Single-month range locking.

  Single-Month Range:
  => When minDate and maxDate fall within the same month,
     navigation and Month / Year selectors are disabled.

  Example:
  => minDate = Sep 1, 2026
  => maxDate = Sep 30, 2026

  Result:
  => September 2026 is displayed but cannot be changed.
===========================================================*/
const DatePickerHeader = ({
  month,
  onMonthChange,

  minDate = null,
  maxDate = null,
}) => {
  /*===========================================================
    Current Visible Month
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
    Normalized Minimum Month
  ===========================================================*/
  const minimumMonth =
    useMemo(
      () =>
        minDate instanceof Date
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
    Normalized Maximum Month
  ===========================================================*/
  const maximumMonth =
    useMemo(
      () =>
        maxDate instanceof Date
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
    Single-Month Range:
    => Used by Budget Month forms.

    Example:
    => September 1 through September 30
    => Month / Year navigation becomes locked.
  ===========================================================*/
  const isSingleMonthRange =
    Boolean(
      minimumMonth &&
      maximumMonth &&
      minimumMonth.getFullYear() ===
      maximumMonth.getFullYear() &&
      minimumMonth.getMonth() ===
      maximumMonth.getMonth()
    );

  /*===========================================================
    Year Options
  ===========================================================*/
  const yearOptions =
    useMemo(
      () =>
        createYearOptions({
          currentYear:
            selectedYear,
          yearsBefore:
            5,
          yearsAfter:
            5,
        }),
      [
        selectedYear,
      ]
    );

  /*===========================================================
    Change Month
  ===========================================================*/
  const handleMonthChange = (
    nextMonth
  ) => {
    if (
      isSingleMonthRange
    ) {
      return;
    }

    const nextDate =
      new Date(
        selectedYear,
        Number(
          nextMonth
        ) - 1,
        1
      );

    /*=========================================================
      Minimum Boundary
    =========================================================*/
    if (
      minimumMonth &&
      nextDate <
      minimumMonth
    ) {
      return;
    }

    /*=========================================================
      Maximum Boundary
    =========================================================*/
    if (
      maximumMonth &&
      nextDate >
      maximumMonth
    ) {
      return;
    }

    onMonthChange?.(
      nextDate
    );
  };

  /*===========================================================
    Change Year
  ===========================================================*/
  const handleYearChange = (
    nextYear
  ) => {
    if (
      isSingleMonthRange
    ) {
      return;
    }

    const nextDate =
      new Date(
        Number(
          nextYear
        ),
        selectedMonth - 1,
        1
      );

    if (
      minimumMonth &&
      nextDate <
      minimumMonth
    ) {
      return;
    }

    if (
      maximumMonth &&
      nextDate >
      maximumMonth
    ) {
      return;
    }

    onMonthChange?.(
      nextDate
    );
  };

  /*===========================================================
    Previous Month
  ===========================================================*/
  const previousMonth =
    new Date(
      selectedYear,
      selectedMonth - 2,
      1
    );

  const previousDisabled =
    isSingleMonthRange ||
    Boolean(
      minimumMonth &&
      previousMonth <
      minimumMonth
    );

  const handlePreviousMonth = () => {
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
    Next Month
  ===========================================================*/
  const nextMonth =
    new Date(
      selectedYear,
      selectedMonth,
      1
    );

  const nextDisabled =
    isSingleMonthRange ||
    Boolean(
      maximumMonth &&
      nextMonth >
      maximumMonth
    );

  const handleNextMonth = () => {
    if (
      nextDisabled
    ) {
      return;
    }

    onMonthChange?.(
      nextMonth
    );
  };

  return (
    <div className="flex items-center justify-between gap-3">
      {/*=======================================================
        Previous Month
      =======================================================*/}
      <DatePickerHeaderNavButton
        direction="previous"
        onClick={
          handlePreviousMonth
        }
        disabled={
          previousDisabled
        }
      />

      {/*=======================================================
        Month / Year Selectors
      =======================================================*/}
      <DatePickerHeaderSelectors
        selectedMonth={
          selectedMonth
        }
        selectedYear={
          selectedYear
        }
        monthOptions={
          MONTH_OPTIONS
        }
        yearOptions={
          yearOptions
        }
        onMonthChange={
          handleMonthChange
        }
        onYearChange={
          handleYearChange
        }
        disabled={
          isSingleMonthRange
        }
      />

      {/*=======================================================
        Next Month
      =======================================================*/}
      <DatePickerHeaderNavButton
        direction="next"
        onClick={
          handleNextMonth
        }
        disabled={
          nextDisabled
        }
      />
    </div>
  );
};

export default DatePickerHeader;