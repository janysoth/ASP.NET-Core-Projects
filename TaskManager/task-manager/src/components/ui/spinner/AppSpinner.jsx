import React from 'react';

/*===========================================================
  AppSpinner:
  => Shared loading spinner.
  => Supports small, medium, and large sizes.
  => Inherits current text color for easy reuse.
===========================================================*/
const AppSpinner = ({
  size = 'md',
  className = '',
  label = 'Loading',
}) => {
  const sizeClasses = {
    sm:
      'h-4 w-4 border-2',

    md:
      'h-6 w-6 border-2',

    lg:
      'h-10 w-10 border-4',
  };

  const selectedSize =
    sizeClasses[size] ??
    sizeClasses.md;

  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block animate-spin rounded-full border-current border-r-transparent ${selectedSize} ${className}`}
    />
  );
};

export default AppSpinner;