import {
  formatApiDate,
  formatDisplayDate,
  parseManualDate,
} from '../utils/dateUtils';

/*===========================================================
  useDateManualEntry:
  => Owns manually-entered date behavior.

  Handles:
  => Typing.
  => Parsing.
  => Min / max validation.
  => Committing manual dates.
  => Blur behavior.

  Supported Input:
  => 8/28
  => 08/28
  => 8/28/26
  => 8/28/2026

  Missing Year:
  => parseManualDate uses the current year.
===========================================================*/
const useDateManualEntry = ({
  dateState,

  onChange,

  disabled = false,
  readOnly = false,

  isWithinRange,
}) => {
  const {
    displayValue,

    inputValue,
    setInputValue,

    setMonth,
  } = dateState;

  /*===========================================================
    Input Change
  ===========================================================*/
  const handleInputChange = (
    event
  ) => {
    if (
      disabled ||
      readOnly
    ) {
      return;
    }

    setInputValue(
      event.target.value
    );
  };

  /*===========================================================
    Commit Manual Date:
    => Returns true when committed successfully.
    => Returns false when invalid.
  ===========================================================*/
  const commitManualDate =
    () => {
      const trimmedValue =
        inputValue.trim();

      /*=======================================================
        Empty
      =======================================================*/
      if (
        trimmedValue ===
        ''
      ) {
        onChange?.('');

        setInputValue('');

        return true;
      }

      /*=======================================================
        Parse
      =======================================================*/
      const parsedDate =
        parseManualDate(
          trimmedValue
        );

      if (
        !parsedDate
      ) {
        setInputValue(
          displayValue
        );

        return false;
      }

      /*=======================================================
        Range
      =======================================================*/
      if (
        !isWithinRange(
          parsedDate
        )
      ) {
        setInputValue(
          displayValue
        );

        return false;
      }

      /*=======================================================
        Normalize
      =======================================================*/
      const nextValue =
        formatApiDate(
          parsedDate
        );

      if (!nextValue) {
        setInputValue(
          displayValue
        );

        return false;
      }

      /*=======================================================
        Commit
      =======================================================*/
      onChange?.(
        nextValue
      );

      setInputValue(
        formatDisplayDate(
          parsedDate
        )
      );

      setMonth(
        new Date(
          parsedDate.getFullYear(),
          parsedDate.getMonth(),
          1
        )
      );

      return true;
    };

  /*===========================================================
    Blur
  ===========================================================*/
  const handleInputBlur =
    () => {
      if (
        disabled ||
        readOnly
      ) {
        return;
      }

      commitManualDate();
    };

  return {
    handleInputChange,
    commitManualDate,
    handleInputBlur,
  };
};

export default useDateManualEntry;