/*===========================================================
  actionButtonBaseClasses:
  => Shared behavior for ActionButton.
===========================================================*/
export const actionButtonBaseClasses =
  'group inline-flex items-center justify-center overflow-hidden rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50';

/*===========================================================
  actionButtonVariants:
  => Standard action colors.
===========================================================*/
export const actionButtonVariants = {
  primary:
    'bg-[var(--app-primary)] text-white hover:bg-[var(--app-primary-hover)]',

  secondary:
    'border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] hover:bg-[var(--app-surface-muted)]',

  success:
    'bg-emerald-600 text-white hover:bg-emerald-700',

  danger:
    'bg-red-600 text-white hover:bg-red-700',

  warning:
    'bg-amber-500 text-white hover:bg-amber-600',

  ghost:
    'text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]',
};

/*===========================================================
  actionButtonSizes:
  => Controls icon-button height and padding.
===========================================================*/
export const actionButtonSizes = {
  sm:
    'h-8 min-w-8 px-2 text-xs',

  md:
    'h-9 min-w-9 px-2.5 text-sm',

  lg:
    'h-10 min-w-10 px-3 text-sm',
};