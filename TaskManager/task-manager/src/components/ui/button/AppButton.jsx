import React from 'react';

/*===========================================================
  AppButton:
  => Shared button component used throughout the app.
===========================================================*/
const AppButton = ({
  type = 'button',
  variant = 'primary',
  children,
  disabled = false,
  loading = false,
  loadingText = 'Working...',
  onClick,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';

  /*===========================================================
    Button color variants
  ===========================================================*/
  const variantClasses = {
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

  const selectedVariant =
    variantClasses[variant] ??
    variantClasses.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${selectedVariant} ${className}`}
      {...props}
    >
      {loading
        ? loadingText
        : children}
    </button>
  );
};

export default AppButton;