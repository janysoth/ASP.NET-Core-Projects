import React from 'react';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/components/icons/Icons';

import {
  DatePickerHeaderNavButton,
  DatePickerHeaderSelectors,
} from './components';

import {
  useDatePickerHeader,
} from './hooks';

/*===========================================================
  DatePickerHeader:
  => Coordinates Date Picker header controls.

  Handles UI:
  => Previous button.
  => Month selector.
  => Year selector.
  => Next button.

  Behavior:
  => Owned by useDatePickerHeader.
===========================================================*/
const DatePickerHeader = ({
  month,
  onMonthChange,

  minDate = null,
  maxDate = null,
}) => {
  const {
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
  } = useDatePickerHeader({
    month,
    onMonthChange,
    minDate,
    maxDate,
  });

  return (
    <div className="flex items-center justify-between gap-3">
      {/*=======================================================
        Previous
      =======================================================*/}
      <DatePickerHeaderNavButton
        ariaLabel="Previous month"
        disabled={
          previousDisabled
        }
        onClick={
          handlePreviousMonth
        }
        icon={
          <ChevronLeftIcon className="h-4 w-4" />
        }
      />

      {/*=======================================================
        Month / Year
      =======================================================*/}
      <DatePickerHeaderSelectors
        selectedMonth={
          selectedMonth
        }
        selectedYear={
          selectedYear
        }
        monthOptions={
          monthOptions
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
      />

      {/*=======================================================
        Next
      =======================================================*/}
      <DatePickerHeaderNavButton
        ariaLabel="Next month"
        disabled={
          nextDisabled
        }
        onClick={
          handleNextMonth
        }
        icon={
          <ChevronRightIcon className="h-4 w-4" />
        }
      />
    </div>
  );
};

export default DatePickerHeader;