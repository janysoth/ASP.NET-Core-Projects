/*===========================================================
  buttonBaseClasses:
  => Shared classes applied to every AppButton.
===========================================================*/
export const buttonBaseClasses =
  'inline-flex items-center justify-center rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';

/*===========================================================
  buttonVariants:
  => Shared color variants.
===========================================================*/
export const buttonVariants = {
  primary:
    'bg-[var(--app-primary)] text-white hover:bg-[var(--app-primary-hover)]',

  secondary:
    'border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] hover:bg-[var(--app-surface-muted)]',

  danger:
    'bg-red-600 text-white hover:bg-red-700',

  warning:
    'bg-amber-500 text-white hover:bg-amber-600',

  ghost:
    'text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]',
};

/*===========================================================
  buttonSizes:
  => Shared button sizing.
===========================================================*/
export const buttonSizes = {
  sm:
    'px-3 py-2 text-xs',

  md:
    'px-4 py-2.5 text-sm',

  lg:
    'px-5 py-3 text-base',
};