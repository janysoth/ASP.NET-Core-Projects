import React from 'react';

import {
  DayPicker,
} from '@daypicker/react';

/*===========================================================
  DatePickerGrid:
  => Calendar day grid used by DateInput.

  IMPORTANT:
  => Navigation and Month/Year controls are handled by
     DatePickerHeader.

  Therefore:
  => DayPicker's built-in caption is hidden.
  => DayPicker's built-in navigation is hidden.
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
  const disabledDates = [];

  if (minDate) {
    disabledDates.push({
      before:
        minDate,
    });
  }

  if (maxDate) {
    disabledDates.push({
      after:
        maxDate,
    });
  }

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
          disabled
            ? undefined
            : onSelect
        }

        disabled={
          disabledDates.length > 0
            ? disabledDates
            : undefined
        }

        /*
          Our DatePickerHeader owns navigation.
        */
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

          /*
            Hide DayPicker's built-in title.

            Our custom DatePickerHeader already displays:
            September   2026
          */
          month_caption:
            'hidden',

          /*
            Extra safety in case DayPicker renders nav markup.
          */
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
              opacity-25

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