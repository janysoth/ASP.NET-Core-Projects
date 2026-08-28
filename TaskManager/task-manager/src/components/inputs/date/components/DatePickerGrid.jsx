import React from 'react';

import {
  DayPicker,
} from '@daypicker/react';

/*===========================================================
  DatePickerGrid:
  => Shared modern calendar grid.

  Handles:
  => Selected day.
  => Visible month.
  => Month navigation.
  => Disabled dates.
  => Min / max date restrictions.
  => Keyboard-accessible calendar behavior.

  IMPORTANT:
  => Does NOT own input state.
  => Does NOT parse or format dates.
  => Does NOT clear the selected value.
     Clear belongs to DatePickerPopover footer.
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
    Disabled Dates:
    => Restricts dates before minDate.
    => Restricts dates after maxDate.
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
    <div
      className="
        date-picker-grid

        rounded-2xl

        bg-[var(--app-surface)]

        p-3
      "
    >
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
        showOutsideDays
        fixedWeeks
        classNames={{
          root:
            'w-full',

          months:
            'w-full',

          month:
            'w-full',

          month_caption:
            `
              relative

              mb-4

              flex
              min-h-10
              items-center
              justify-center
            `,

          caption_label:
            `
              text-sm
              font-bold
              tracking-tight
              text-[var(--app-text)]
            `,

          nav:
            `
              absolute
              inset-x-0
              top-0

              flex
              items-center
              justify-between

              pointer-events-none
            `,

          button_previous:
            `
              pointer-events-auto

              flex
              h-9
              w-9
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
            `,

          button_next:
            `
              pointer-events-auto

              flex
              h-9
              w-9
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
            `,

          month_grid:
            'w-full border-collapse',

          weekdays:
            '',

          weekday:
            `
              pb-2

              text-center
              text-[11px]
              font-bold
              uppercase
              tracking-wide
              text-[var(--app-text-muted)]
            `,

          week:
            '',

          day:
            `
              p-0
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
              font-medium
              text-[var(--app-text)]

              transition-all
              duration-150

              hover:bg-[var(--app-primary)]/10
              hover:text-[var(--app-primary)]

              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[var(--app-primary)]/20
            `,

          selected:
            `
              [&>button]:
              bg-[var(--app-primary)]

              [&>button]:
              text-white

              [&>button:hover]:
              bg-[var(--app-primary-hover)]

              [&>button:hover]:
              text-white
            `,

          today:
            `
              [&>button]:
              ring-1

              [&>button]:
              ring-inset

              [&>button]:
              ring-[var(--app-primary)]

              [&>button]:
              font-bold
            `,

          outside:
            `
              [&>button]:
              text-[var(--app-text-muted)]

              [&>button]:
              opacity-40
            `,

          disabled:
            `
              [&>button]:
              cursor-not-allowed

              [&>button]:
              opacity-30

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