import React, {
  useEffect,
} from 'react';

import {
  createPortal,
} from 'react-dom';

/*===========================================================
  AppModal:
  => Shared modal wrapper used across the application.

  Features:
  => Renders through a portal.
  => Prevents background page scrolling.
  => Optionally closes when Escape is pressed.
  => Optionally closes when the backdrop is clicked.
  => Supports configurable width and stacking level.
===========================================================*/
const AppModal = ({
  isOpen,
  onClose,
  children,

  maxWidth = 'max-w-lg',
  zIndex = 'z-[100]',

  closeOnEscape = true,
  closeOnBackdrop = true,

  actionInProgress = false,

  ariaLabelledBy,
  ariaDescribedBy,
}) => {
  /*===========================================================
    Escape key:
    => Closes only when Escape closing is enabled.
    => Does not close while an action is running.
  ===========================================================*/
  useEffect(() => {
    if (
      !isOpen ||
      !closeOnEscape
    ) {
      return undefined;
    }

    const handleKeyDown = (
      event
    ) => {
      if (
        event.key === 'Escape' &&
        !actionInProgress
      ) {
        onClose?.();
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [
    isOpen,
    closeOnEscape,
    actionInProgress,
    onClose,
  ]);

  /*===========================================================
    Body scrolling:
    => Prevents the page behind an open modal from scrolling.
    => Restores the previous overflow value when closed.
  ===========================================================*/
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    isOpen,
  ]);

  if (!isOpen) {
    return null;
  }

  /*===========================================================
    handleBackdropMouseDown:
    => Closes only when the backdrop itself is clicked.
    => Clicking inside the modal does not close it.
  ===========================================================*/
  const handleBackdropMouseDown = (
    event
  ) => {
    if (
      event.target !==
      event.currentTarget ||
      !closeOnBackdrop ||
      actionInProgress
    ) {
      return;
    }

    onClose?.();
  };

  return createPortal(
    <div
      className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-slate-950/60 px-4 py-6`}
      onMouseDown={
        handleBackdropMouseDown
      }
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={
          ariaLabelledBy
        }
        aria-describedby={
          ariaDescribedBy
        }
        className={`max-h-[calc(100vh-3rem)] w-full overflow-y-auto rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-2xl ${maxWidth}`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default AppModal;