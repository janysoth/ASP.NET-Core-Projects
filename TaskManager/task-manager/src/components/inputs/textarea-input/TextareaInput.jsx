import React from 'react';

import {
  FormField,
} from '../field';

/*===========================================================
  TextareaInput:
  => Shared multi-line text input.

  Handles:
  => Label.
  => Optional indicator.
  => Helper text.
  => Validation error.
  => Disabled / read-only state.
  => Consistent application styling.

  IMPORTANT:
  => Use for notes, descriptions, comments, etc.
===========================================================*/
const TextareaInput = ({
  label,
  htmlFor,
  name,

  value = '',
  onChange,

  placeholder = '',

  rows = 3,

  disabled = false,
  readOnly = false,

  optional = false,

  helperText = '',
  error = '',

  maxLength,

  className = '',
}) => {
  return (
    <FormField
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
      <textarea
        id={
          htmlFor
        }
        name={
          name
        }
        value={
          value
        }
        onChange={
          onChange
        }
        placeholder={
          placeholder
        }
        rows={
          rows
        }
        disabled={
          disabled
        }
        readOnly={
          readOnly
        }
        maxLength={
          maxLength
        }
        className={`
          w-full
          resize-y

          rounded-xl
          border

          bg-[var(--app-surface)]

          px-4
          py-3

          text-sm
          leading-6
          text-[var(--app-text)]

          outline-none

          transition-all
          duration-200

          placeholder:text-[var(--app-text-muted)]

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
      />
    </FormField>
  );
};

export default TextareaInput;