import React from 'react';

import {
  FloatingFocusManager,
  FloatingPortal,
} from '@floating-ui/react';

/*===========================================================
  FloatingPanel:
  => Shared floating visual container.

  Used by:
  => Dropdown.
  => Date Picker.
  => User Menu.
  => Context Menu.
  => Future floating controls.

  Handles:
  => Portal rendering.
  => Focus management.
  => Layering.
  => Shared styling.
  => Entry animation.

  IMPORTANT:
  => Waits until Floating UI finishes positioning before
     making the panel visible.

  This prevents:
  => Popup briefly appearing at the top-left of the screen.
  => Popup visually traveling into its calculated position.
===========================================================*/
const FloatingPanel = ({
  open,

  overlay,

  width,

  className = '',

  children,
}) => {
  if (
    !open ||
    !overlay
  ) {
    return null;
  }

  return (
    <FloatingPortal>
      <FloatingFocusManager
        context={
          overlay.context
        }
        modal={false}
      >
        <div
          ref={
            overlay.refs
              .setFloating
          }
          style={{
            ...overlay.floatingStyles,

            width,

            /*
              Floating controls must sit above modal content.
            */
            zIndex: 1000,

            /*
              Do not reveal the panel until Floating UI knows
              its correct position.

              This removes the top-left "fly in" effect.
            */
            visibility:
              overlay.isPositioned
                ? 'visible'
                : 'hidden',
          }}
          {...overlay.getFloatingProps()}
          className={`
            overflow-hidden

            rounded-2xl

            border
            border-[var(--app-border)]

            bg-[var(--app-surface)]

            shadow-2xl

            ring-1
            ring-black/5

            ${overlay.isPositioned
              ? `
                    animate-in
                    fade-in
                    zoom-in-95
                    duration-150
                  `
              : ''
            }

            ${className}
          `}
        >
          {children}
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  );
};

export default FloatingPanel;