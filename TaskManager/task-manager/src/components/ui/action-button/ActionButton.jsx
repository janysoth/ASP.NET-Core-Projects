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
  => Shared action button used throughout the application.

  Supports:
  => Icon-only appearance.
  => Expandable label on hover.
  => Always-visible labels.
  => Loading state.
  => Keyboard accessibility.

  Expandable behavior:
  => Icon is always visible.
  => Hovering or keyboard-focusing THIS button expands
     the label beside the icon.
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
      className={`
        group
        ${actionButtonBaseClasses}
        ${selectedVariant}
        ${selectedSize}
        ${className}
      `}
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

          {showLabel && (
            <span className="whitespace-nowrap">
              {loadingText}
            </span>
          )}
        </span>
      ) : (
        <span className="inline-flex items-center">
          {/*=================================================
            Icon:
            => Always visible.
            => Remains anchored while the label expands.
          =================================================*/}
          {icon && (
            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
              {icon}
            </span>
          )}

          {/*=================================================
            Expandable label:
            => Width starts at zero.
            => Expands when THIS button is hovered.
            => Also expands for keyboard focus.
          =================================================*/}
          {expandable &&
            label && (
              <span
                className="
                  inline-block
                  max-w-0
                  overflow-hidden
                  whitespace-nowrap
                  opacity-0

                  transition-all
                  duration-150
                  ease-out

                  group-hover:ml-2
                  group-hover:max-w-[120px]
                  group-hover:opacity-100

                  group-focus-visible:ml-2
                  group-focus-visible:max-w-[120px]
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