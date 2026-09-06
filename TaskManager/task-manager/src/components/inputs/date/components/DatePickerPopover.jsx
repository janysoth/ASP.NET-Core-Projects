import React from 'react';

import DatePickerGrid from './DatePickerGrid';
import DatePickerHeader from './DatePickerHeader';

/*===========================================================
  DatePickerPopover:
  => Modern calendar panel used by DateInput.

  Layout:
  => Custom Month / Year header.
  => Calendar grid.
  => Clear / Today footer.
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
      <div className="px-4 pb-3 pt-4">
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
        Divider
      =======================================================*/}
      <div className="mx-4 border-t border-[var(--app-border)]" />

      {/*=======================================================
        Calendar
      =======================================================*/}
      <div className="px-4 py-4">
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
          Clear
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
          Today
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