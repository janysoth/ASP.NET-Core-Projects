import useDateCalendarActions from './useDateCalendarActions';
import useDateKeyboard from './useDateKeyboard';
import useDateManualEntry from './useDateManualEntry';

/*===========================================================
  useDateInputActions:
  => Coordinates DateInput behavior hooks.

  Combines:
  => Calendar actions.
  => Manual input actions.
  => Keyboard actions.

  IMPORTANT:
  => Keeps DateInput.jsx unaware of internal behavior details.
===========================================================*/
const useDateInputActions = ({
  dateState,

  onChange,

  disabled = false,
  readOnly = false,

  setOpen,
}) => {
  /*===========================================================
    Calendar Actions
  ===========================================================*/
  const calendarActions =
    useDateCalendarActions({
      dateState,
      onChange,
      disabled,
      readOnly,
      setOpen,
    });

  /*===========================================================
    Manual Entry
  ===========================================================*/
  const manualActions =
    useDateManualEntry({
      dateState,
      onChange,
      disabled,
      readOnly,
      isWithinRange:
        calendarActions.isWithinRange,
    });

  /*===========================================================
    Keyboard
  ===========================================================*/
  const keyboardActions =
    useDateKeyboard({
      dateState,
      commitManualDate:
        manualActions.commitManualDate,
      disabled,
      readOnly,
      setOpen,
    });

  return {
    /*=========================================================
      Calendar
    =========================================================*/
    handleOpenCalendar:
      calendarActions
        .handleOpenCalendar,

    handleSelectDate:
      calendarActions
        .handleSelectDate,

    handleClear:
      calendarActions
        .handleClear,

    handleToday:
      calendarActions
        .handleToday,

    /*=========================================================
      Manual Input
    =========================================================*/
    handleInputChange:
      manualActions
        .handleInputChange,

    handleInputBlur:
      manualActions
        .handleInputBlur,

    /*=========================================================
      Keyboard
    =========================================================*/
    handleInputFocus:
      keyboardActions
        .handleInputFocus,

    handleInputKeyDown:
      keyboardActions
        .handleInputKeyDown,
  };
};

export default useDateInputActions;