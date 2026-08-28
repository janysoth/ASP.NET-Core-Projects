import React from 'react';

import {
  Dropdown,
} from '@/components/ui/dropdown';

/*===========================================================
  DatePickerHeaderSelectors:
  => Displays Month and Year dropdown selectors.

  Handles:
  => Selected month.
  => Selected year.
  => Month options.
  => Year options.

  IMPORTANT:
  => No dropdown arrow is shown.
===========================================================*/
const DatePickerHeaderSelectors = ({
  selectedMonth,
  selectedYear,

  monthOptions = [],
  yearOptions = [],

  onMonthChange,
  onYearChange,
}) => {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
      {/*=======================================================
        Month
      =======================================================*/}
      <div className="w-[124px]">
        <Dropdown
          value={
            selectedMonth
          }
          items={
            monthOptions
          }
          onChange={
            onMonthChange
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

      {/*=======================================================
        Year
      =======================================================*/}
      <div className="w-[90px]">
        <Dropdown
          value={
            selectedYear
          }
          items={
            yearOptions
          }
          onChange={
            onYearChange
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
  );
};

export default DatePickerHeaderSelectors;