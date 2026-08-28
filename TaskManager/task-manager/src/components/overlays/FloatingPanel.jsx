import React from 'react';

import {
  FloatingFocusManager,
  FloatingPortal,
} from '@floating-ui/react';

/*===========================================================
  FloatingPanel

  => Shared floating container.

  Used by:
  => Dropdown
  => Date Picker
  => User Menu
  => Context Menu
  => Future floating UI.

  IMPORTANT:
  => Receives the entire overlay object from
     useFloatingOverlay().
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
          }}
          {...overlay.getFloatingProps()}
          className={`
            z-50

            overflow-hidden

            rounded-2xl

            border
            border-[var(--app-border)]

            bg-[var(--app-surface)]

            shadow-2xl

            ring-1
            ring-black/5

            transition-all
            duration-150

            origin-top-left

            animate-in
            fade-in
            zoom-in-95

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