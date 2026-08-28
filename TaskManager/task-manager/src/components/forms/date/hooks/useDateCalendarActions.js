import {
  formatApiDate,
  formatDisplayDate,
} from '../dateUtils';

/*===========================================================
  useDateCalendarActions:
  => Owns calendar-based DateInput actions.

  Handles:
  => Date range validation.
  => Opening the calendar.
  => Calendar date selection.
  => Clear.
  => Today.
===========================================================*/
const useDateCalendarActions = ({
  dateState,

  onChange,

  disabled = false,
  readOnly = false,

  setOpen,
}) => {
  const {
    selectedDate,

    setInputValue,
    setMonth,

    normalizedMinDate,
    normalizedMaxDate,

    todayDisabled,
  } = dateState;

  /*===========================================================
    isWithinRange
  ===========================================================*/
  const isWithinRange = (
    date
  ) => {
    if (
      !date ||
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
      normalizedMinDate &&
      normalizedDate <
      normalizedMinDate
    ) {
      return false;
    }

    if (
      normalizedMaxDate &&
      normalizedDate >
      normalizedMaxDate
    ) {
      return false;
    }

    return true;
  };

  /*===========================================================
    Open Calendar
  ===========================================================*/
  const handleOpenCalendar =
    () => {
      if (
        disabled ||
        readOnly
      ) {
        return;
      }

      if (
        selectedDate
      ) {
        setMonth(
          new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            1
          )
        );
      }

      setOpen?.(
        true
      );
    };

  /*===========================================================
    Select Date
  ===========================================================*/
  const handleSelectDate = (
    nextDate
  ) => {
    if (
      disabled ||
      readOnly ||
      !nextDate ||
      !isWithinRange(
        nextDate
      )
    ) {
      return;
    }

    const nextValue =
      formatApiDate(
        nextDate
      );

    if (!nextValue) {
      return;
    }

    onChange?.(
      nextValue
    );

    setInputValue(
      formatDisplayDate(
        nextDate
      )
    );

    setMonth(
      new Date(
        nextDate.getFullYear(),
        nextDate.getMonth(),
        1
      )
    );

    setOpen?.(
      false
    );
  };

  /*===========================================================
    Clear
  ===========================================================*/
  const handleClear =
    () => {
      if (
        disabled ||
        readOnly
      ) {
        return;
      }

      onChange?.('');

      setInputValue('');

      setOpen?.(
        false
      );
    };

  /*===========================================================
    Today
  ===========================================================*/
  const handleToday =
    () => {
      if (
        disabled ||
        readOnly ||
        todayDisabled
      ) {
        return;
      }

      const now =
        new Date();

      const today =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

      if (
        !isWithinRange(
          today
        )
      ) {
        return;
      }

      onChange?.(
        formatApiDate(
          today
        )
      );

      setInputValue(
        formatDisplayDate(
          today
        )
      );

      setMonth(
        new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        )
      );

      setOpen?.(
        false
      );
    };

  return {
    isWithinRange,

    handleOpenCalendar,
    handleSelectDate,
    handleClear,
    handleToday,
  };
};

export default useDateCalendarActions;