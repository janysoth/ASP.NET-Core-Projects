import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  FloatingPanel,
  useFloatingOverlay,
} from '@/components/overlays';

import AppFormField from '../AppFormField';

import DateInputField from './DateInputField';
import DatePickerPopover from './DatePickerPopover';

import {
  clampDate,
  formatApiDate,
  formatDisplayDate,
  parseApiDate,
  parseManualDate,
} from './dateUtils';

/*===========================================================
  DateInput:
  => Shared application date picker.

  Current Responsibilities:
  => Render label / helper / error.
  => Open and close calendar.
  => Convert stored YYYY-MM-DD value into Date.
  => Display dates as MMM DD, YYYY.
  => Keep calendar month synchronized.
  => Select a date from the calendar.
  => Clear the selected date.

  Examples:

  Stored:
  => 2026-08-28

  Displayed:
  => Aug 28, 2026

  Next Step:
  => Manual MM/DD[/YYYY] entry.
===========================================================*/
const DateInput = ({
  label,

  htmlFor,
  name,

  value = '',

  onChange,

  placeholder = 'MM/DD/YYYY',

  disabled = false,
  readOnly = false,

  helperText = '',
  error = '',

  optional = false,

  minDate = null,
  maxDate = null,

  clearable = true,

  className = '',
}) => {
  /*===========================================================
    Open State
  ===========================================================*/
  const [
    open,
    setOpen,
  ] = useState(false);

  /*===========================================================
    Selected Date:
    => Parent value remains the source of truth.
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
    Visible Month:
    => Selected date when one exists.
    => Otherwise current calendar month.
  ===========================================================*/
  const [
    month,
    setMonth,
  ] = useState(
    () =>
      selectedDate ??
      new Date()
  );

  /*===========================================================
  Input Text

  Allows users to type dates without immediately
  changing the parent value.
===========================================================*/
  const [
    inputValue,
    setInputValue,
  ] = useState(
    displayValue
  );

  /*===========================================================
    Sync Visible Month:
    => When parent value changes externally, move the calendar
       to that selected month.
  ===========================================================*/
  useEffect(() => {
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
  }, [
    selectedDate,
  ]);

  /*===========================================================
  Sync Display Text

  Updates the textbox whenever the parent value changes.
===========================================================*/
  useEffect(() => {
    setInputValue(
      displayValue
    );
  }, [
    displayValue,
  ]);

  /*===========================================================
    Display Value:
    => User sees MMM DD, YYYY.

    Example:
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
    Floating Overlay
  ===========================================================*/
  const overlay =
    useFloatingOverlay({
      open,
      onOpenChange:
        setOpen,
      placement:
        'bottom-start',
      role:
        'dialog',
    });

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

      /*
        Reopen on the currently selected date when possible.
      */
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

      setOpen(
        true
      );
    };

  /*===========================================================
    Select Date:
    => DayPicker supplies a Date object.
    => Parent receives YYYY-MM-DD.
    => Picker closes after selection.
  ===========================================================*/
  const handleSelectDate =
    (
      nextDate
    ) => {
      if (
        disabled ||
        readOnly ||
        !nextDate
      ) {
        return;
      }

      const nextValue =
        formatApiDate(
          nextDate
        );

      if (
        !nextValue
      ) {
        return;
      }

      onChange?.(
        nextValue
      );

      setMonth(
        new Date(
          nextDate.getFullYear(),
          nextDate.getMonth(),
          1
        )
      );

      setOpen(
        false
      );
    };

  /*===========================================================
    Clear Date
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

      setOpen(
        false
      );
    };

  /*===========================================================
Manual Typing
===========================================================*/
  const handleInputChange = (
    event
  ) => {
    setInputValue(
      event.target.value
    );
  };

  /*===========================================================
    Validate Manual Entry
  
    Examples
  
    8/28
  
    8/28/26
  
    8/28/2026
  ===========================================================*/
  const handleInputBlur =
    () => {
      if (
        inputValue.trim() ===
        ''
      ) {
        onChange?.('');
        return;
      }

      const parsedDate =
        parseManualDate(
          inputValue
        );

      if (
        !parsedDate
      ) {
        setInputValue(
          displayValue
        );
        return;
      }

      const finalDate =
        clampDate(
          parsedDate,
          minDate,
          maxDate
        );

      if (
        !finalDate
      ) {
        setInputValue(
          displayValue
        );
        return;
      }

      onChange?.(
        formatApiDate(
          finalDate
        )
      );

      setMonth(
        new Date(
          finalDate.getFullYear(),
          finalDate.getMonth(),
          1
        )
      );

      setInputValue(
        formatDisplayDate(
          finalDate
        )
      );
    };

  return (
    <AppFormField
      label={
        label
      }
      htmlFor={
        htmlFor
      }
      helperText={
        helperText
      }
      error={
        error
      }
      optional={
        optional
      }
      className={
        className
      }
    >
      {/*=======================================================
        Date Field / Floating Reference
      =======================================================*/}
      <div
        ref={
          overlay.refs
            .setReference
        }
        {...overlay.getReferenceProps()}
      >
        <DateInputField
          id={
            htmlFor
          }
          name={
            name
          }
          value={
            displayValue
          }
          placeholder={
            placeholder
          }
          disabled={
            disabled
          }
          readOnly={
            readOnly
          }
          error={
            error
          }

          onChange={
            handleInputChange
          }

          onBlur={
            handleInputBlur
          }

          onOpenCalendar={
            handleOpenCalendar
          }
          onClear={
            handleClear
          }
          clearable={
            clearable
          }
        />
      </div>

      {/*=======================================================
        Calendar Popover
      =======================================================*/}
      <FloatingPanel
        open={
          open
        }
        overlay={
          overlay
        }
        width={
          320
        }
      >
        <DatePickerPopover
          selectedDate={
            selectedDate
          }
          month={
            month
          }
          onMonthChange={
            setMonth
          }
          onSelectDate={
            handleSelectDate
          }
          minDate={
            minDate
          }
          maxDate={
            maxDate
          }
          onClear={
            handleClear
          }

          /*
            Today gets wired in a later step.
          */
          onToday={() => { }}
          clearDisabled={
            !selectedDate
          }
          disabled={
            disabled ||
            readOnly
          }
        />
      </FloatingPanel>
    </AppFormField>
  );
};

export default DateInput;