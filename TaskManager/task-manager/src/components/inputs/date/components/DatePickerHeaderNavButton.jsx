import React from 'react';

/*===========================================================
  DatePickerHeaderNavButton:
  => Shared previous / next navigation button.

  Handles:
  => Consistent styling.
  => Disabled state.
  => Accessibility label.

  IMPORTANT:
  => Does not know whether it is previous or next.
  => Parent supplies the icon.
===========================================================*/
const DatePickerHeaderNavButton = ({
  icon,
  ariaLabel,

  onClick,

  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      disabled={
        disabled
      }
      aria-label={
        ariaLabel
      }
      className="
        flex
        h-9
        w-9
        shrink-0
        items-center
        justify-center

        rounded-xl

        border
        border-[var(--app-border)]

        bg-[var(--app-surface)]

        text-[var(--app-text-muted)]

        transition-all
        duration-200

        hover:border-[var(--app-primary)]/50
        hover:bg-[var(--app-primary)]/10
        hover:text-[var(--app-primary)]

        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[var(--app-primary)]/20

        disabled:cursor-not-allowed
        disabled:opacity-30
        disabled:hover:border-[var(--app-border)]
        disabled:hover:bg-transparent
        disabled:hover:text-[var(--app-text-muted)]
      "
    >
      {icon}
    </button>
  );
};

export default DatePickerHeaderNavButton;