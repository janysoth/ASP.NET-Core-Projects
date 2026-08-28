import React from 'react';

import {
  CheckIcon,
} from '@/components/icons/Icons';

/*===========================================================
  DropdownItem:
  => Shared dropdown option.

  Handles:
  => Hover state.
  => Selected state.
  => Click action.

  IMPORTANT:
  => Does not manage dropdown state.
===========================================================*/
const DropdownItem = ({
  label,
  value,

  selected = false,

  onSelect,

  disabled = false,
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onSelect?.(value);
        }
      }}
      className={`
        flex
        w-full
        items-center
        justify-between

        rounded-lg

        px-3
        py-2.5

        text-left
        text-sm
        font-medium

        transition-all
        duration-150

        ${disabled
          ? `
                cursor-not-allowed
                opacity-40
              `
          : `
                cursor-pointer

                hover:bg-[var(--app-primary)]/10
                hover:text-[var(--app-primary)]
              `
        }

        ${selected
          ? `
                bg-[var(--app-primary)]/10
                text-[var(--app-primary)]
              `
          : `
                text-[var(--app-text)]
              `
        }
      `}
    >
      <span>
        {label}
      </span>

      {selected && (
        <CheckIcon className="h-4 w-4" />
      )}
    </button>
  );
};

export default DropdownItem;