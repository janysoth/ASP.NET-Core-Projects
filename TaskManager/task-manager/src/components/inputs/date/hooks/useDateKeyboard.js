/*===========================================================
  useDateKeyboard:
  => Owns keyboard and focus behavior for DateInput.

  Handles:
  => Select existing text on focus.
  => Enter to commit.
  => Escape to cancel.
===========================================================*/
const useDateKeyboard = ({
  dateState,

  commitManualDate,

  disabled = false,
  readOnly = false,

  setOpen,
}) => {
  const {
    displayValue,
    setInputValue,
  } = dateState;

  /*===========================================================
    Focus
  ===========================================================*/
  const handleInputFocus = (
    event
  ) => {
    if (
      disabled ||
      readOnly
    ) {
      return;
    }

    event.target.select();
  };

  /*===========================================================
    Key Down
  ===========================================================*/
  const handleInputKeyDown = (
    event
  ) => {
    /*=========================================================
      Enter
    =========================================================*/
    if (
      event.key ===
      'Enter'
    ) {
      event.preventDefault();

      const committed =
        commitManualDate();

      if (
        committed
      ) {
        setOpen?.(
          false
        );

        event.currentTarget.blur();
      }

      return;
    }

    /*=========================================================
      Escape
    =========================================================*/
    if (
      event.key ===
      'Escape'
    ) {
      event.preventDefault();

      setInputValue(
        displayValue
      );

      setOpen?.(
        false
      );

      event.currentTarget.blur();
    }
  };

  return {
    handleInputFocus,
    handleInputKeyDown,
  };
};

export default useDateKeyboard;