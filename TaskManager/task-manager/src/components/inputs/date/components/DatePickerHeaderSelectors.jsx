import React from 'react';

import {
  Dropdown,
} from '@/components/ui/dropdown';

/*===========================================================
  DatePickerHeaderSelectors:
  => Displays Month and Year controls.

  Handles:
  => Month dropdown.
  => Year dropdown.
  => Locked Month / Year display.

  Locked State:
  => When disabled, Month and Year still look like header
     controls but cannot be opened.

  IMPORTANT:
  => DatePickerHeader owns all date calculations.
===========================================================*/
const DatePickerHeaderSelectors = ({
  selectedMonth,
  selectedYear,

  monthOptions = [],
  yearOptions = [],

  onMonthChange,
  onYearChange,

  disabled = false,
}) => {
  /*===========================================================
    Selected Month Label
  ===========================================================*/
  const selectedMonthOption =
    monthOptions.find(
      (
        option
      ) =>
        Number(
          option.value
        ) ===
        Number(
          selectedMonth
        )
    );

  const monthLabel =
    selectedMonthOption?.label ??
    '';

  /*===========================================================
    Locked Display
  ===========================================================*/
  if (
    disabled
  ) {
    return (
      <div
        className="
          flex
          min-w-0
          flex-1
          items-center
          justify-center
          gap-1
        "
      >
        {/*=====================================================
          Locked Month
        =====================================================*/}
        <div
          className="
            w-[124px]

            rounded-xl

            px-3
            py-2

            text-center
            text-sm
            font-bold
            text-[var(--app-text)]

            select-none
          "
        >
          {monthLabel}
        </div>

        {/*=====================================================
          Locked Year
        =====================================================*/}
        <div
          className="
            w-[90px]

            rounded-xl

            px-3
            py-2

            text-center
            text-sm
            font-bold
            text-[var(--app-text)]

            select-none
          "
        >
          {selectedYear}
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        flex
        min-w-0
        flex-1
        items-center
        justify-center
        gap-1
      "
    >
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