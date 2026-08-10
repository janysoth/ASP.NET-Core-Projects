import React from 'react';

import {
  AppSpinner,
} from '@/components/ui/spinner';

import {
  actionButtonBaseClasses,
  actionButtonSizes,
  actionButtonVariants,
} from './actionButtonStyles';

/*===========================================================
  ActionButton:
  => Shared action button used for row/tool actions.

  Supports:
  => Icon only.
  => Icon + visible label.
  => Icon that expands into a label on hover.
  => Loading state.
  => Multiple color variants.
===========================================================*/
const ActionButton = ({
  type = 'button',

  variant = 'ghost',
  size = 'md',

  icon,
  label,

  expandable = false,
  showLabel = false,

  disabled = false,

  loading = false,
  loadingText = 'Working...',

  onClick,

  className = '',

  ...props
}) => {
  const selectedVariant =
    actionButtonVariants[variant] ??
    actionButtonVariants.ghost;

  const selectedSize =
    actionButtonSizes[size] ??
    actionButtonSizes.md;

  const shouldDisplayLabel =
    showLabel ||
    expandable;

  const accessibleLabel =
    loading
      ? loadingText
      : label;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={
        disabled ||
        loading
      }
      aria-label={
        accessibleLabel
      }
      title={
        expandable
          ? undefined
          : accessibleLabel
      }
      className={`${actionButtonBaseClasses} ${selectedVariant} ${selectedSize} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <AppSpinner
            size="sm"
            label={
              loadingText
            }
          />

          {shouldDisplayLabel && (
            <span className="whitespace-nowrap">
              {loadingText}
            </span>
          )}
        </span>
      ) : (
        <span className="inline-flex items-center">
          {/*=================================================
            Icon
          =================================================*/}
          {icon && (
            <span className="flex shrink-0 items-center justify-center">
              {icon}
            </span>
          )}

          {/*=================================================
            Expandable label
          =================================================*/}
          {expandable && label && (
            <span
              className="
                max-w-0
                overflow-hidden
                whitespace-nowrap
                opacity-0
                transition-all
                duration-200
                group-hover:ml-2
                group-hover:max-w-40
                group-hover:opacity-100
                group-focus-visible:ml-2
                group-focus-visible:max-w-40
                group-focus-visible:opacity-100
              "
            >
              {label}
            </span>
          )}

          {/*=================================================
            Always-visible label
          =================================================*/}
          {!expandable &&
            showLabel &&
            label && (
              <span className="ml-2 whitespace-nowrap">
                {label}
              </span>
            )}
        </span>
      )}
    </button>
  );
};

export default ActionButton;