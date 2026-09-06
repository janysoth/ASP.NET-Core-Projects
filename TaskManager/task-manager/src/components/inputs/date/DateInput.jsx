import React, {
  useMemo,
  useState,
} from 'react';

import {
  FloatingPanel,
  useFloatingOverlay,
} from '@/components/overlays';

import {
  FormField,
} from '@/components/inputs/field';

import DateInputField from './components/DateInputField';

import DatePickerPopover from './components/DatePickerPopover';

import {
  useDateInputActions,
  useDateInputState,
} from './hooks';

/*===========================================================
  DateInput:
  => Shared application date picker.

  Supports:
  => Calendar selection.
  => Manual entry.
  => MMM DD, YYYY display.
  => YYYY-MM-DD storage.
  => Min / max dates.
  => Clear.
  => Today.
  => Keyboard support.

  Popup Alignment:
  => field
     Center beneath the DateInput.

  => start
     Align to left edge of DateInput.

  => end
     Align to right edge of DateInput.

  => modal-center
     Center horizontally inside nearest modal.

  IMPORTANT:
  => popupOffset controls vertical spacing.
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

  popupAlign = 'field',

  popupOffset = 4,

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
    Date State
  ===========================================================*/
  const dateState =
    useDateInputState({
      value,
      minDate,
      maxDate,
    });

  /*===========================================================
    Date Actions
  ===========================================================*/
  const actions =
    useDateInputActions({
      dateState,
      onChange,
      disabled,
      readOnly,
      setOpen,
    });

  /*===========================================================
    Floating Placement
  ===========================================================*/
  const placement =
    useMemo(
      () => {
        switch (
        popupAlign
        ) {
          case 'start':
            return 'bottom-start';

          case 'end':
            return 'bottom-end';

          case 'modal-center':
          case 'field':
          default:
            return 'bottom';
        }
      },
      [
        popupAlign,
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

      placement,

      role:
        'dialog',

      /*
        Calendar icon already controls opening.
      */
      enableClick:
        false,

      /*
        Center relative to AppModal instead of viewport.
      */
      centerInModal:
        popupAlign ===
        'modal-center',

      offsetSize:
        popupOffset,
    });

  return (
    <FormField
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
        Date Field
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
            dateState.inputValue
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
            actions.handleInputChange
          }
          onBlur={
            actions.handleInputBlur
          }
          onFocus={
            actions.handleInputFocus
          }
          onKeyDown={
            actions.handleInputKeyDown
          }
          onOpenCalendar={
            actions.handleOpenCalendar
          }
          onClear={
            actions.handleClear
          }
          clearable={
            clearable
          }
        />
      </div>

      {/*=======================================================
        Calendar
      =======================================================*/}
      <FloatingPanel
        open={
          open
        }
        overlay={
          overlay
        }
        width={
          312
        }
      >
        <DatePickerPopover
          selectedDate={
            dateState.selectedDate
          }
          month={
            dateState.month
          }
          onMonthChange={
            dateState.setMonth
          }
          onSelectDate={
            actions.handleSelectDate
          }
          minDate={
            dateState.normalizedMinDate
          }
          maxDate={
            dateState.normalizedMaxDate
          }
          onClear={
            actions.handleClear
          }
          onToday={
            actions.handleToday
          }
          clearDisabled={
            dateState.clearDisabled
          }
          todayDisabled={
            dateState.todayDisabled
          }
          disabled={
            disabled ||
            readOnly
          }
        />
      </FloatingPanel>
    </FormField>
  );
};

export default DateInput;