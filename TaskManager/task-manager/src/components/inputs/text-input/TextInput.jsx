import React from 'react';

import AppFormField from '../field/AppFormField';


/*===========================================================
  AppInput:
  => Shared application text input.

  Handles:
  => Label.
  => Optional indicator.
  => Helper text.
  => Validation error.
  => Consistent styling.

  IMPORTANT:
  => Use for text, email, password, number, etc.
===========================================================*/
const TextInput = ({
  label,
  htmlFor,
  name,

  type = 'text',

  value,
  onChange,

  placeholder = '',

  disabled = false,
  readOnly = false,

  optional = false,

  helperText = '',
  error = '',

  min,
  max,
  step,

  autoComplete,

  leftPadding = false,

  className = '',
}) => {
  return (
    <AppFormField
      label={label}
      htmlFor={htmlFor}
      optional={optional}
      helperText={helperText}
      error={error}
      className={className}
    >
      <input
        id={htmlFor}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        min={min}
        max={max}
        step={step}
        autoComplete={autoComplete}
        className={`
          w-full
          rounded-xl
          border

          bg-[var(--app-surface)]

          ${leftPadding
            ? 'pl-9'
            : 'px-3'
          }

          py-2.5

          text-sm
          text-[var(--app-text)]

          outline-none

          transition

          placeholder:text-[var(--app-text-muted)]

          focus:border-[var(--app-primary)]
          focus:ring-2
          focus:ring-[var(--app-primary)]/20

          disabled:cursor-not-allowed
          disabled:opacity-70

          ${error
            ? 'border-red-500'
            : 'border-[var(--app-border)]'
          }
        `}
      />
    </AppFormField>
  );
};

export default TextInput;