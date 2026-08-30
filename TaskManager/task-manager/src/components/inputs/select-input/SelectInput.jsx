import React from 'react';

import {
  ChevronDownIcon,
} from '@/components/icons/Icons';
import {
  FormField,
} from '../field';



/*===========================================================
  AppSelect:
  => Shared application select component.

  Handles:
  => Label.
  => Validation.
  => Helper text.
  => Optional indicator.
  => Modern dropdown styling.
===========================================================*/
const SelectInput = ({
  label,
  htmlFor,
  name,

  value,
  onChange,

  options = [],

  disabled = false,

  optional = false,

  helperText = '',
  error = '',

  className = '',

  optionValueKey = 'value',
  optionLabelKey = 'label',
}) => {
  return (
    <FormField
      label={label}
      htmlFor={htmlFor}
      optional={optional}
      helperText={helperText}
      error={error}
      className={className}
    >
      <div className="group relative">
        <select
          id={htmlFor}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`
            w-full
            appearance-none

            rounded-xl
            border

            bg-[var(--app-surface)]

            px-4
            py-3
            pr-11

            text-sm
            font-medium
            text-[var(--app-text)]

            outline-none

            transition-all
            duration-200

            hover:border-[var(--app-primary)]/50

            focus:border-[var(--app-primary)]
            focus:ring-2
            focus:ring-[var(--app-primary)]/20

            disabled:cursor-not-allowed
            disabled:bg-[var(--app-surface-muted)]
            disabled:opacity-70

            ${error
              ? 'border-red-500'
              : 'border-[var(--app-border)]'
            }
          `}
        >
          {options.map(
            (option) => (
              <option
                key={
                  option[
                  optionValueKey
                  ]
                }
                value={
                  option[
                  optionValueKey
                  ]
                }
              >
                {
                  option[
                  optionLabelKey
                  ]
                }
              </option>
            )
          )}
        </select>

        {/*=====================================================
          Chevron
        =====================================================*/}
        <div
          className="
            pointer-events-none

            absolute
            right-3
            top-1/2

            -translate-y-1/2

            rounded-lg
            p-1

            text-[var(--app-text-muted)]

            transition-all
            duration-200

            group-hover:text-[var(--app-primary)]
            group-focus-within:text-[var(--app-primary)]
          "
        >
          <ChevronDownIcon className="h-4 w-4" />
        </div>
      </div>
    </FormField>
  );
};

export default SelectInput;