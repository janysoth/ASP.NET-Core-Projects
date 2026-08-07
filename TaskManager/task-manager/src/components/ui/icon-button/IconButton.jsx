import React from 'react';

import {
  iconButtonBaseClasses,
  iconButtonSizes,
  iconButtonVariants,
} from './iconButtonStyles';

/*===========================================================
  IconButton:
  => Shared icon-only action button.
  => Requires an accessible label.
===========================================================*/
const IconButton = ({
  type = 'button',
  variant = 'ghost',
  size = 'md',
  label,
  children,
  disabled = false,
  onClick,
  className = '',
  ...props
}) => {
  const selectedVariant =
    iconButtonVariants[variant] ??
    iconButtonVariants.ghost;

  const selectedSize =
    iconButtonSizes[size] ??
    iconButtonSizes.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`${iconButtonBaseClasses} ${selectedVariant} ${selectedSize} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default IconButton;