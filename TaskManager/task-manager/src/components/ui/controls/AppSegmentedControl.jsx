import React from 'react';

/*===========================================================
  AppSegmentedControl
  => Reusable segmented control.
===========================================================*/
const AppSegmentedControl = ({
  options = [],
  value,
  onChange,
}) => {
  return (
    <div className="inline-flex rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-1">
      {options.map((option) => {
        const active =
          option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() =>
              onChange(option.value)
            }
            className={`
              rounded-lg
              px-3
              py-1.5
              text-sm
              font-medium
              transition-all

              ${active
                ? 'bg-[var(--app-surface)] text-[var(--app-primary)] shadow-sm'
                : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
              }
            `}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default AppSegmentedControl;