import React from 'react';

import {
  buttonBaseClasses,
  buttonSizes,
  buttonVariants,
} from './buttonStyles';

/*===========================================================
  AppButton:
  => Shared button component.
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
      disabled={disabled || loading}
      className={`${buttonBaseClasses} ${selectedVariant} ${selectedSize} ${className}`}
      {...props}
    >
      {loading
        ? loadingText
        : children}
    </button>
  );
};

export default AppButton;