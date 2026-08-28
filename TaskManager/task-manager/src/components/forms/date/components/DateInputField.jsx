import React, {
  forwardRef,
} from 'react';

import {
  CalendarIcon,
  XIcon,
} from '@/components/icons/Icons';

/*===========================================================
  DateInputField:
  => Visual input control used by DateInput.

  Handles:
  => Calendar icon.
  => Manual text entry.
  => Clear button.
  => Error styling.
  => Disabled / read-only styling.
  => Modern shared form-control appearance.

  IMPORTANT:
  => Does NOT parse dates.
  => Does NOT own calendar state.
  => Parent DateInput controls all date behavior.
===========================================================*/
const DateInputField =
  forwardRef(
    (
      {
        id,
        name,

        value = '',

        placeholder =
        'MM/DD/YYYY',

        disabled = false,
        readOnly = false,

        error = '',

        onChange,
        onBlur,
        onFocus,
        onKeyDown,

        onOpenCalendar,
        onClear,

        clearable = true,
      },
      ref
    ) => {
      const showClearButton =
        clearable &&
        Boolean(value) &&
        !disabled &&
        !readOnly;

      return (
        <div
          className={`
            group

            flex
            w-full
            items-stretch

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
              ? `
                    cursor-not-allowed
                    bg-[var(--app-surface-muted)]
                    opacity-70
                  `
              : ''
            }
          `}
        >
          {/*===================================================
            Calendar Trigger
          ===================================================*/}
          <button
            type="button"
            onClick={
              onOpenCalendar
            }
            disabled={
              disabled ||
              readOnly
            }
            aria-label="Open calendar"
            className="
              flex
              w-12
              shrink-0
              items-center
              justify-center

              border-r
              border-[var(--app-border)]

              bg-[var(--app-surface-muted)]

              text-[var(--app-text-muted)]

              transition-all
              duration-200

              hover:bg-[var(--app-primary)]/10
              hover:text-[var(--app-primary)]

              focus-visible:outline-none
              focus-visible:text-[var(--app-primary)]

              disabled:cursor-not-allowed
            "
          >
            <CalendarIcon className="h-4 w-4" />
          </button>

          {/*===================================================
            Manual Date Entry
          ===================================================*/}
          <input
            ref={
              ref
            }
            id={
              id
            }
            name={
              name
            }
            type="text"
            value={
              value
            }
            onChange={
              onChange
            }
            onBlur={
              onBlur
            }
            onFocus={
              onFocus
            }
            onKeyDown={
              onKeyDown
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
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={
              Boolean(error)
            }
            className="
              min-w-0
              flex-1

              border-0
              bg-transparent

              px-4
              py-3

              text-sm
              font-medium
              text-[var(--app-text)]

              outline-none

              placeholder:text-[var(--app-text-muted)]

              disabled:cursor-not-allowed
            "
          />

          {/*===================================================
            Clear Button
          ===================================================*/}
          {showClearButton && (
            <div className="flex items-center pr-2">
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();

                  onClear?.();
                }}
                aria-label="Clear date"
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center

                  rounded-lg

                  text-[var(--app-text-muted)]

                  transition-all
                  duration-200

                  hover:bg-red-50
                  hover:text-red-600

                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-red-500/20

                  dark:hover:bg-red-500/10
                  dark:hover:text-red-400
                "
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      );
    }
  );

DateInputField.displayName =
  'DateInputField';

export default DateInputField;