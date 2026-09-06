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

  IMPORTANT:
  => Positioning is controlled completely by Floating UI.
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

            zIndex:
              1000,

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