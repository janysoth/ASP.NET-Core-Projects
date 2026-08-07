/*===========================================================
  iconButtonBaseClasses:
  => Shared styles for every IconButton.
===========================================================*/
export const iconButtonBaseClasses =
  'inline-flex items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50';

/*===========================================================
  iconButtonVariants:
  => Standard icon-button colors.
===========================================================*/
export const iconButtonVariants = {
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
  iconButtonSizes:
  => Standard icon-only button sizing.
===========================================================*/
export const iconButtonSizes = {
  sm:
    'h-8 w-8',

  md:
    'h-9 w-9',

  lg:
    'h-10 w-10',
};