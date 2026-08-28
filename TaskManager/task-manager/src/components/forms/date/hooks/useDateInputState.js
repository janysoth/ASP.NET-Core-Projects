import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  formatDisplayDate,
  parseApiDate,
} from '../dateUtils';

/*===========================================================
  normalizeDate:
  => Converts supported min/max values into local Date objects.

  Supports:
  => Date objects.
  => YYYY-MM-DD strings.

  IMPORTANT:
  => Uses local date values to avoid UTC timezone shifting.
===========================================================*/
const normalizeDate = (
  value
) => {
  if (!value) {
    return null;
  }

  /*=========================================================
    Date Object
  =========================================================*/
  if (
    value instanceof Date &&
    !Number.isNaN(
      value.getTime()
    )
  ) {
    return new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate()
    );
  }

  /*=========================================================
    YYYY-MM-DD String
  =========================================================*/
  if (
    typeof value ===
    'string'
  ) {
    return parseApiDate(
      value
    );
  }

  return null;
};

/*===========================================================
  useDateInputState:
  => Owns DateInput state and derived values.

  Handles:
  => Selected Date.
  => Display Value.
  => Manual Input Value.
  => Visible Calendar Month.
  => Normalized Min Date.
  => Normalized Max Date.
  => Today availability.
  => Clear availability.
  => Synchronization when parent value changes.

  IMPORTANT:
  => Does NOT perform actions.
  => Does NOT call the parent's onChange.
  => Does NOT open or close the date picker.
===========================================================*/
const useDateInputState = ({
  value = '',

  minDate = null,
  maxDate = null,
}) => {
  /*===========================================================
    Selected Date:
    => Parent YYYY-MM-DD value remains the source of truth.
  ===========================================================*/
  const selectedDate =
    useMemo(
      () =>
        parseApiDate(
          value
        ),
      [
        value,
      ]
    );

  /*===========================================================
    Display Value:
    => Converts YYYY-MM-DD into MMM DD, YYYY.

    Example:
    => 2026-08-28
    => Aug 28, 2026
  ===========================================================*/
  const displayValue =
    useMemo(
      () =>
        selectedDate
          ? formatDisplayDate(
            selectedDate
          )
          : '',
      [
        selectedDate,
      ]
    );

  /*===========================================================
    Manual Input Value:
    => Allows the user to type without immediately changing
       the parent value.
  ===========================================================*/
  const [
    inputValue,
    setInputValue,
  ] = useState(
    displayValue
  );

  /*===========================================================
    Visible Calendar Month:
    => Selected month when a date exists.
    => Otherwise current month.
  ===========================================================*/
  const [
    month,
    setMonth,
  ] = useState(
    () => {
      const initialDate =
        selectedDate ??
        new Date();

      return new Date(
        initialDate.getFullYear(),
        initialDate.getMonth(),
        1
      );
    }
  );

  /*===========================================================
    Normalized Minimum Date
  ===========================================================*/
  const normalizedMinDate =
    useMemo(
      () =>
        normalizeDate(
          minDate
        ),
      [
        minDate,
      ]
    );

  /*===========================================================
    Normalized Maximum Date
  ===========================================================*/
  const normalizedMaxDate =
    useMemo(
      () =>
        normalizeDate(
          maxDate
        ),
      [
        maxDate,
      ]
    );

  /*===========================================================
    Synchronize Input Value:
    => If the parent changes the selected date externally,
       update the visible text.
  ===========================================================*/
  useEffect(() => {
    setInputValue(
      displayValue
    );
  }, [
    displayValue,
  ]);

  /*===========================================================
    Synchronize Calendar Month:
    => If the parent changes the selected date externally,
       move the calendar to that month.
  ===========================================================*/
  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    setMonth(
      new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        1
      )
    );
  }, [
    selectedDate,
  ]);

  /*===========================================================
    Today Disabled:
    => Today is unavailable when it falls outside min/max.
  ===========================================================*/
  const todayDisabled =
    useMemo(
      () => {
        const today =
          new Date();

        const normalizedToday =
          new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
          );

        if (
          normalizedMinDate &&
          normalizedToday <
          normalizedMinDate
        ) {
          return true;
        }

        if (
          normalizedMaxDate &&
          normalizedToday >
          normalizedMaxDate
        ) {
          return true;
        }

        return false;
      },
      [
        normalizedMinDate,
        normalizedMaxDate,
      ]
    );

  /*===========================================================
    Clear Disabled:
    => Clear is disabled only when there is no selected date
       and no manually-entered text.
  ===========================================================*/
  const clearDisabled =
    !selectedDate &&
    inputValue.trim() === '';

  return {
    /*=========================================================
      Selected / Display Values
    =========================================================*/
    selectedDate,
    displayValue,

    /*=========================================================
      Input State
    =========================================================*/
    inputValue,
    setInputValue,

    /*=========================================================
      Calendar State
    =========================================================*/
    month,
    setMonth,

    /*=========================================================
      Date Boundaries
    =========================================================*/
    normalizedMinDate,
    normalizedMaxDate,

    /*=========================================================
      Derived Action State
    =========================================================*/
    todayDisabled,
    clearDisabled,
  };
};

export default useDateInputState;