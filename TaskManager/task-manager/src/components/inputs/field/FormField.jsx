import React from 'react';

/*===========================================================
  FormField:
  => Shared wrapper for application form controls.

  Handles:
  => Label.
  => Optional indicator.
  => Helper text.
  => Validation error.
  => Consistent vertical spacing.

  IMPORTANT:
  => Does not render the input itself.
  => Input/select/textarea is passed through children.
===========================================================*/
const FormField = ({
  label,
  htmlFor,

  optional = false,

  helperText = '',
  error = '',

  children,

  className = '',
}) => {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-semibold text-[var(--app-text)]"
        >
          {label}

          {optional && (
            <span className="ml-1 font-normal text-[var(--app-text-muted)]">
              (optional)
            </span>
          )}
        </label>
      )}

      <div className={label ? 'mt-2' : ''}>
        {children}
      </div>

      {!error &&
        helperText && (
          <p className="mt-2 text-xs text-[var(--app-text-muted)]">
            {helperText}
          </p>
        )}

      {error && (
        <p
          className="mt-2 text-xs font-medium text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;