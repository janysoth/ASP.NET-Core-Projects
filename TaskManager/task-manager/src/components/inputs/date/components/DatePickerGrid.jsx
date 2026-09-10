import React, {
  useMemo,
} from 'react';

import {
  DayPicker,
} from '@daypicker/react';

/*===========================================================
  DatePickerGrid:
  => Calendar day grid used by DateInput.

  Handles:
  => Selected date.
  => Minimum / maximum date restrictions.
  => Disabled out-of-range days.
  => Preventing out-of-range selection.
  => Calendar month boundaries.

  IMPORTANT:
  => Navigation and Month/Year controls are handled by
     DatePickerHeader.
===========================================================*/
const DatePickerGrid = ({
  selectedDate = null,

  month,
  onMonthChange,

  onSelect,

  minDate = null,
  maxDate = null,

  disabled = false,
}) => {
  /*===========================================================
    Disabled Date Rules
  ===========================================================*/
  const disabledDates =
    useMemo(
      () => {
        const rules = [];

        if (minDate) {
          rules.push({
            before:
              minDate,
          });
        }

        if (maxDate) {
          rules.push({
            after:
              maxDate,
          });
        }

        return rules;
      },
      [
        minDate,
        maxDate,
      ]
    );

  /*===========================================================
    First Allowed Month
  ===========================================================*/
  const startMonth =
    useMemo(
      () =>
        minDate
          ? new Date(
            minDate.getFullYear(),
            minDate.getMonth(),
            1
          )
          : undefined,
      [
        minDate,
      ]
    );

  /*===========================================================
    Last Allowed Month
  ===========================================================*/
  const endMonth =
    useMemo(
      () =>
        maxDate
          ? new Date(
            maxDate.getFullYear(),
            maxDate.getMonth(),
            1
          )
          : undefined,
      [
        maxDate,
      ]
    );

  /*===========================================================
    Is Date Allowed:
    => Second safety layer independent of DayPicker.

    IMPORTANT:
    => Prevents an out-of-range date from ever reaching
       DateInput's parent onChange.
  ===========================================================*/
  const isDateAllowed = (
    date
  ) => {
    if (
      !(date instanceof Date) ||
      Number.isNaN(
        date.getTime()
      )
    ) {
      return false;
    }

    const normalizedDate =
      new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );

    if (
      minDate &&
      normalizedDate <
      minDate
    ) {
      return false;
    }

    if (
      maxDate &&
      normalizedDate >
      maxDate
    ) {
      return false;
    }

    return true;
  };

  /*===========================================================
    Select Date
  ===========================================================*/
  const handleSelect = (
    nextDate
  ) => {
    if (
      disabled ||
      !nextDate ||
      !isDateAllowed(
        nextDate
      )
    ) {
      return;
    }

    onSelect?.(
      nextDate
    );
  };

  return (
    <div className="w-full">
      <DayPicker
        mode="single"

        selected={
          selectedDate ??
          undefined
        }

        month={
          month
        }

        onMonthChange={
          onMonthChange
        }

        onSelect={
          handleSelect
        }

        /*=====================================================
          Allowed Calendar Range
        =====================================================*/
        startMonth={
          startMonth
        }

        endMonth={
          endMonth
        }

        /*=====================================================
          Disabled Days
        =====================================================*/
        disabled={
          disabledDates.length > 0
            ? disabledDates
            : undefined
        }

        /*=====================================================
          Custom Header Owns Navigation
        =====================================================*/
        hideNavigation

        showOutsideDays
        fixedWeeks

        classNames={{
          /*===================================================
            Root
          ===================================================*/
          root:
            'w-full',

          months:
            'w-full',

          month:
            'w-full',

          /*===================================================
            Hide Built-In Header / Navigation
          ===================================================*/
          month_caption:
            'hidden',

          nav:
            'hidden',

          /*===================================================
            Grid
          ===================================================*/
          month_grid:
            'w-full border-collapse',

          weekdays:
            '',

          weekday:
            `
              pb-3

              text-center
              text-[11px]
              font-bold
              uppercase
              tracking-wider

              text-[var(--app-text-muted)]
            `,

          week:
            '',

          /*===================================================
            Day Cell
          ===================================================*/
          day:
            `
              p-0.5
              text-center
            `,

          day_button:
            `
              mx-auto

              flex
              h-9
              w-9
              items-center
              justify-center

              rounded-xl

              text-sm
              font-semibold
              text-[var(--app-text)]

              transition-all
              duration-150

              hover:bg-[var(--app-primary)]/10
              hover:text-[var(--app-primary)]

              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[var(--app-primary)]/25
            `,

          /*===================================================
            Selected
          ===================================================*/
          selected:
            `
              [&>button]:
              bg-[var(--app-primary)]

              [&>button]:
              text-white

              [&>button]:
              shadow-sm

              [&>button:hover]:
              bg-[var(--app-primary)]

              [&>button:hover]:
              text-white
            `,

          /*===================================================
            Today
          ===================================================*/
          today:
            `
              [&>button]:
              ring-2

              [&>button]:
              ring-inset

              [&>button]:
              ring-[var(--app-primary)]/60

              [&>button]:
              font-bold
            `,

          /*===================================================
            Outside Month
          ===================================================*/
          outside:
            `
              [&>button]:
              text-[var(--app-text-muted)]

              [&>button]:
              opacity-40
            `,

          /*===================================================
            Disabled
          ===================================================*/
          disabled:
            `
              [&>button]:
              cursor-not-allowed

              [&>button]:
              opacity-20

              [&>button]:
              text-[var(--app-text-muted)]

              [&>button:hover]:
              bg-transparent

              [&>button:hover]:
              text-[var(--app-text-muted)]
            `,

          hidden:
            'invisible',
        }}
      />
    </div>
  );
};

export default DatePickerGrid;