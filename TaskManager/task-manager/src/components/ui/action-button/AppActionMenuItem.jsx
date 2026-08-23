import React from 'react';

/*===========================================================
  AppActionMenuItem:
  => One action inside AppActionMenu.

  Variants:
  => default
  => danger

  Behavior:
  => Executes supplied action.
  => Automatically closes parent menu afterward.
===========================================================*/
const AppActionMenuItem = ({
  icon,
  children,

  variant = 'default',

  onClick,
  closeMenu,

  disabled = false,
}) => {
  const variantClasses =
    variant === 'danger'
      ? `
          text-red-600
          hover:bg-red-50

          dark:text-red-400
          dark:hover:bg-red-500/10
        `
      : `
          text-[var(--app-text)]
          hover:bg-[var(--app-surface-muted)]
        `;

  /*===========================================================
    Handle Click
  ===========================================================*/
  const handleClick = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (
      disabled
    ) {
      return;
    }

    closeMenu?.();

    onClick?.(
      event
    );
  };

  return (
    <button
      type="button"
      role="menuitem"
      disabled={
        disabled
      }
      onClick={
        handleClick
      }
      className={`
        flex
        w-full
        items-center
        gap-2.5

        rounded-lg
        px-3
        py-2

        text-left
        text-sm
        font-semibold

        transition-colors
        duration-150

        disabled:cursor-not-allowed
        disabled:opacity-50

        ${variantClasses}
      `}
    >
      {icon && (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
          {icon}
        </span>
      )}

      <span className="whitespace-nowrap">
        {children}
      </span>
    </button>
  );
};

export default AppActionMenuItem;