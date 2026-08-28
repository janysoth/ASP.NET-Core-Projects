import React, {
  useState,
} from 'react';

import {
  FloatingPanel,
  useFloatingOverlay,
} from '@/components/overlays';

import AppFormField from '../AppFormField';

import DateInputField from './components/DateInputField';
import DatePickerPopover from './DatePickerPopover';

import {
  useDateInputActions,
  useDateInputState,
} from './hooks';

/*===========================================================
  DateInput:
  => Shared application date picker.

  Supports:
  => Calendar selection.
  => Manual date entry.
  => MMM DD, YYYY display.
  => YYYY-MM-DD storage.
  => Current-year fallback.
  => Minimum / maximum dates.
  => Clear.
  => Today.
  => Enter / Escape keyboard behavior.

  Architecture:
  => useDateInputState owns state and derived values.
  => useDateInputActions owns user interactions.
  => DateInput coordinates UI components.
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
    Open State:
    => Owned here because it belongs to the floating UI.
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
        Input / Floating Reference
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
    </AppFormField>
  );
};

export default DateInput;