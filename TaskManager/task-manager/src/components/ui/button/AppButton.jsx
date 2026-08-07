import React from 'react';

import {
  AppSpinner,
} from '@/components/ui/spinner';

import {
  buttonBaseClasses,
  buttonSizes,
  buttonVariants,
} from './buttonStyles';

/*===========================================================
  AppButton:
  => Shared button component.
  => Supports:
     - variants
     - sizes
     - loading state
     - loading spinner
     - disabled state
===========================================================*/
const AppButton = ({
  type = 'button',
  variant = 'primary',
  size = 'md',
  children,
  disabled = false,
  loading = false,
  loadingText = 'Working...',
  onClick,
  className = '',
  ...props
}) => {
  const selectedVariant =
    buttonVariants[variant] ??
    buttonVariants.primary;

  const selectedSize =
    buttonSizes[size] ??
    buttonSizes.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={
        disabled ||
        loading
      }
      className={`${buttonBaseClasses} ${selectedVariant} ${selectedSize} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <AppSpinner
            size="sm"
            label={loadingText}
          />

          <span>
            {loadingText}
          </span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default AppButton;