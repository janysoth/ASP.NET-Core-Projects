import React from 'react';

/*===========================================================
  AppFormField:
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
const AppFormField = ({
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
      {/*=======================================================
        Label
      =======================================================*/}
      {label && (
        <label
          htmlFor={
            htmlFor
          }
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

      {/*=======================================================
        Control
      =======================================================*/}
      <div className={label ? 'mt-2' : ''}>
        {children}
      </div>

      {/*=======================================================
        Helper Text
      =======================================================*/}
      {!error &&
        helperText && (
          <p className="mt-2 text-xs text-[var(--app-text-muted)]">
            {helperText}
          </p>
        )}

      {/*=======================================================
        Validation Error
      =======================================================*/}
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

export default AppFormField;