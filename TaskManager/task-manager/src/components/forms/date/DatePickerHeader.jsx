import React, {
  useMemo,
} from 'react';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/components/icons/Icons';

import {
  Dropdown,
} from '@/components/ui/dropdown';

import {
  MONTH_OPTIONS,
  createYearOptions,
} from '@/features/budget/utils';

/*===========================================================
  DatePickerHeader:
  => Header for the custom Date Picker.

  Handles:
  => Previous month.
  => Next month.
  => Month selection.
  => Year selection.

  Year Range:
  => 5 years before selected year.
  => 5 years after selected year.

  IMPORTANT:
  => Month and Year are separate clickable controls.
  => No down-arrow is shown beside Month or Year.
===========================================================*/
const DatePickerHeader = ({
  month,
  onMonthChange,

  minDate = null,
  maxDate = null,
}) => {
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
    Change Month
  ===========================================================*/
  const handleMonthChange = (
    nextMonth
  ) => {
    const nextDate =
      new Date(
        selectedYear,
        Number(nextMonth) - 1,
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
    nextYear
  ) => {
    const nextDate =
      new Date(
        Number(nextYear),
        selectedMonth - 1,
        1
      );

    onMonthChange?.(
      nextDate
    );
  };

  /*===========================================================
    Previous Month
  ===========================================================*/
  const handlePreviousMonth = () => {
    onMonthChange?.(
      new Date(
        selectedYear,
        selectedMonth - 2,
        1
      )
    );
  };

  /*===========================================================
    Next Month
  ===========================================================*/
  const handleNextMonth = () => {
    onMonthChange?.(
      new Date(
        selectedYear,
        selectedMonth,
        1
      )
    );
  };

  /*===========================================================
    Previous / Next Disabled State
  ===========================================================*/
  const previousMonth =
    new Date(
      selectedYear,
      selectedMonth - 2,
      1
    );

  const nextMonth =
    new Date(
      selectedYear,
      selectedMonth,
      1
    );

  const previousDisabled =
    Boolean(
      minDate &&
      previousMonth <
      new Date(
        minDate.getFullYear(),
        minDate.getMonth(),
        1
      )
    );

  const nextDisabled =
    Boolean(
      maxDate &&
      nextMonth >
      new Date(
        maxDate.getFullYear(),
        maxDate.getMonth(),
        1
      )
    );

  return (
    <div className="flex items-center justify-between gap-3">
      {/*=======================================================
        Previous Month
      =======================================================*/}
      <button
        type="button"
        onClick={
          handlePreviousMonth
        }
        disabled={
          previousDisabled
        }
        aria-label="Previous month"
        className="
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center

          rounded-xl

          border
          border-[var(--app-border)]

          bg-[var(--app-surface)]

          text-[var(--app-text-muted)]

          transition-all
          duration-200

          hover:border-[var(--app-primary)]/50
          hover:bg-[var(--app-primary)]/10
          hover:text-[var(--app-primary)]

          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-[var(--app-primary)]/20

          disabled:cursor-not-allowed
          disabled:opacity-30
          disabled:hover:border-[var(--app-border)]
          disabled:hover:bg-transparent
          disabled:hover:text-[var(--app-text-muted)]
        "
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>

      {/*=======================================================
        Month / Year
      =======================================================*/}
      <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
        {/*=====================================================
          Month
        =====================================================*/}
        <div className="w-[124px]">
          <Dropdown
            value={
              selectedMonth
            }
            items={
              MONTH_OPTIONS
            }
            onChange={
              handleMonthChange
            }
            width="trigger"
            className="
              border-transparent
              bg-transparent
              px-3
              py-2

              text-center
              font-bold

              hover:border-transparent
              hover:bg-[var(--app-primary)]/10

              [&>svg]:hidden
            "
          />
        </div>

        {/*=====================================================
          Year
        =====================================================*/}
        <div className="w-[90px]">
          <Dropdown
            value={
              selectedYear
            }
            items={
              yearOptions
            }
            onChange={
              handleYearChange
            }
            width="trigger"
            className="
              border-transparent
              bg-transparent
              px-3
              py-2

              text-center
              font-bold

              hover:border-transparent
              hover:bg-[var(--app-primary)]/10

              [&>svg]:hidden
            "
          />
        </div>
      </div>

      {/*=======================================================
        Next Month
      =======================================================*/}
      <button
        type="button"
        onClick={
          handleNextMonth
        }
        disabled={
          nextDisabled
        }
        aria-label="Next month"
        className="
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center

          rounded-xl

          border
          border-[var(--app-border)]

          bg-[var(--app-surface)]

          text-[var(--app-text-muted)]

          transition-all
          duration-200

          hover:border-[var(--app-primary)]/50
          hover:bg-[var(--app-primary)]/10
          hover:text-[var(--app-primary)]

          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-[var(--app-primary)]/20

          disabled:cursor-not-allowed
          disabled:opacity-30
          disabled:hover:border-[var(--app-border)]
          disabled:hover:bg-transparent
          disabled:hover:text-[var(--app-text-muted)]
        "
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

export default DatePickerHeader;