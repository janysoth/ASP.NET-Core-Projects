import React from 'react';

import {
  NumericFormat,
} from 'react-number-format';

import AppFormField from '../field/FormField';

/*===========================================================
  MoneyInput:
  => Shared financial input for monetary values.

  Handles:
  => Thousands separators.
  => Two decimal places.
  => Dedicated currency-symbol section.
  => Right-aligned financial values.
  => Validation styling.
  => Helper text.
  => Disabled / read-only states.
  => Mobile decimal keyboard.

  Value Contract:
  => "value" should be an unformatted numeric string.

  Example:
  => Parent value:
     "7000.50"

  => Display:
     $ | 7,000.50

  onValueChange:
  => Receives the unformatted numeric string first.
  => Also receives the complete react-number-format values
     object as the second argument.
===========================================================*/
const MoneyInput = ({
  label,
  htmlFor,
  name,

  value = '',
  onValueChange,

  currencySymbol = '$',

  placeholder = '0.00',

  decimalScale = 2,
  fixedDecimalScale = true,

  allowNegative = false,

  disabled = false,
  readOnly = false,

  optional = false,

  helperText = '',
  error = '',

  className = '',
}) => {
  /*===========================================================
    Handle Value Change:
    => values.value is the raw numeric string.

    Examples:
    => Display "1,250.00"
       values.value = "1250.00"

    => Display "45.75"
       values.value = "45.75"
  ===========================================================*/
  const handleValueChange = (
    values,
    sourceInfo
  ) => {
    onValueChange?.(
      values.value,
      values,
      sourceInfo
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
      optional={
        optional
      }
      helperText={
        helperText
      }
      error={
        error
      }
      className={
        className
      }
    >
      {/*=======================================================
        Money Control:
        => Currency symbol and value share one outer border.
        => flex layout keeps symbol perfectly centered.
      =======================================================*/}
      <div
        className={`
          flex
          w-full
          overflow-hidden
          rounded-xl
          border

          bg-[var(--app-surface)]

          transition-all
          duration-200

          focus-within:ring-2
          focus-within:ring-[var(--app-primary)]/20

          ${error
            ? `
                  border-red-500
                  focus-within:border-red-500
                `
            : `
                  border-[var(--app-border)]
                  hover:border-[var(--app-primary)]/50
                  focus-within:border-[var(--app-primary)]
                `
          }

          ${disabled
            ? 'cursor-not-allowed opacity-70'
            : ''
          }
        `}
      >
        {/*=====================================================
          Currency Symbol:
          => Dedicated section prevents alignment problems.
        =====================================================*/}
        <div
          aria-hidden="true"
          className="
            flex
            min-w-12
            shrink-0
            items-center
            justify-center

            border-r
            border-[var(--app-border)]

            bg-[var(--app-surface-muted)]

            px-3

            text-sm
            font-semibold
            text-[var(--app-text-muted)]
          "
        >
          {currencySymbol}
        </div>

        {/*=====================================================
          Formatted Amount
        =====================================================*/}
        <NumericFormat
          id={
            htmlFor
          }
          name={
            name
          }
          value={
            value
          }
          onValueChange={
            handleValueChange
          }
          valueIsNumericString
          thousandSeparator=","
          decimalSeparator="."
          decimalScale={
            decimalScale
          }
          fixedDecimalScale={
            fixedDecimalScale
          }
          allowNegative={
            allowNegative
          }
          allowLeadingZeros={false}
          placeholder={
            placeholder
          }
          disabled={
            disabled
          }
          readOnly={
            readOnly
          }
          inputMode="decimal"
          autoComplete="off"
          className="
            min-w-0
            flex-1

            border-0
            bg-transparent

            px-4
            py-3

            text-right
            text-sm
            font-semibold
            tabular-nums
            text-[var(--app-text)]

            outline-none

            placeholder:text-[var(--app-text-muted)]

            disabled:cursor-not-allowed
          "
        />
      </div>
    </AppFormField>
  );
};

export default MoneyInput;