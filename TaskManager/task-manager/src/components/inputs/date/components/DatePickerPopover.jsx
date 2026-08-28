import React from 'react';

import DatePickerGrid from './DatePickerGrid';
import DatePickerHeader from './DatePickerHeader';

/*===========================================================
  DatePickerPopover:
  => Visual calendar panel used by DateInput.

  Handles:
  => Date Picker header.
  => Calendar grid.
  => Footer actions.
  => Clear action on the left.
  => Today action on the right.

  IMPORTANT:
  => Does NOT own floating positioning.
  => Parent DateInput controls open / close state.
===========================================================*/
const DatePickerPopover = ({
  selectedDate = null,

  month,
  onMonthChange,

  onSelectDate,

  minDate = null,
  maxDate = null,

  onClear,
  onToday,

  clearDisabled = false,
  todayDisabled = false,

  disabled = false,
}) => {
  return (
    <div
      className="
        w-[320px]
        max-w-[calc(100vw-2rem)]

        bg-[var(--app-surface)]
      "
    >
      {/*=======================================================
        Header
      =======================================================*/}
      <div className="px-4 pb-2 pt-4">
        <DatePickerHeader
          month={
            month
          }
          onMonthChange={
            onMonthChange
          }
          minDate={
            minDate
          }
          maxDate={
            maxDate
          }
        />
      </div>

      {/*=======================================================
        Calendar
      =======================================================*/}
      <div className="px-2 pb-3">
        <DatePickerGrid
          selectedDate={
            selectedDate
          }
          month={
            month
          }
          onMonthChange={
            onMonthChange
          }
          onSelect={
            onSelectDate
          }
          minDate={
            minDate
          }
          maxDate={
            maxDate
          }
          disabled={
            disabled
          }
        />
      </div>

      {/*=======================================================
        Footer
      =======================================================*/}
      <div
        className="
          flex
          items-center
          justify-between

          border-t
          border-[var(--app-border)]

          px-4
          py-3
        "
      >
        {/*=====================================================
          Clear:
          => Secondary / destructive action.
          => Positioned on the left.
        =====================================================*/}
        <button
          type="button"
          onClick={
            onClear
          }
          disabled={
            disabled ||
            clearDisabled
          }
          className="
            rounded-lg

            px-3
            py-2

            text-sm
            font-semibold
            text-[var(--app-text-muted)]

            transition-all
            duration-200

            hover:bg-red-50
            hover:text-red-600

            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-red-500/20

            disabled:cursor-not-allowed
            disabled:opacity-40
            disabled:hover:bg-transparent
            disabled:hover:text-[var(--app-text-muted)]

            dark:hover:bg-red-500/10
            dark:hover:text-red-400
          "
        >
          Clear
        </button>

        {/*=====================================================
          Today:
          => Primary shortcut.
          => Positioned on the right.
        =====================================================*/}
        <button
          type="button"
          onClick={
            onToday
          }
          disabled={
            disabled ||
            todayDisabled
          }
          className="
            rounded-lg

            px-3
            py-2

            text-sm
            font-semibold
            text-[var(--app-primary)]

            transition-all
            duration-200

            hover:bg-[var(--app-primary)]/10

            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[var(--app-primary)]/20

            disabled:cursor-not-allowed
            disabled:opacity-40
            disabled:hover:bg-transparent
          "
        >
          Today
        </button>
      </div>
    </div>
  );
};

export default DatePickerPopover;