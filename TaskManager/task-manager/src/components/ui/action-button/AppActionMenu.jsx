import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

/*===========================================================
  AppActionMenu:
  => Shared compact action menu.

  Supports:
  => Default three-dot trigger.
  => Custom trigger element.
  => Click outside to close.
  => Escape key to close.
  => Keyboard-friendly button trigger.

  Usage:
  <AppActionMenu>
    ...
  </AppActionMenu>

  Or:

  <AppActionMenu
    trigger={
      <CustomIcon />
    }
  >
    ...
  </AppActionMenu>
===========================================================*/
const AppActionMenu = ({
  children,
  trigger = null,
  ariaLabel = 'Open actions menu',
  className = '',
}) => {
  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const menuRef =
    useRef(null);

  /*===========================================================
    Close Menu
  ===========================================================*/
  const closeMenu = () => {
    setIsOpen(
      false
    );
  };

  /*===========================================================
    Toggle Menu
  ===========================================================*/
  const toggleMenu = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setIsOpen(
      (
        current
      ) =>
        !current
    );
  };

  /*===========================================================
    Outside Click / Escape
  ===========================================================*/
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (
      event
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target
        )
      ) {
        closeMenu();
      }
    };

    const handleKeyDown = (
      event
    ) => {
      if (
        event.key ===
        'Escape'
      ) {
        closeMenu();
      }
    };

    document.addEventListener(
      'mousedown',
      handlePointerDown
    );

    document.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handlePointerDown
      );

      document.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [
    isOpen,
  ]);

  return (
    <div
      ref={
        menuRef
      }
      className={`relative ${className}`}
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      {/*=======================================================
        Trigger
      =======================================================*/}
      <button
        type="button"
        aria-label={
          ariaLabel
        }
        aria-haspopup="menu"
        aria-expanded={
          isOpen
        }
        onClick={
          toggleMenu
        }
        className="
          flex
          items-center
          justify-center

          rounded-xl

          transition
          duration-200

          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-[var(--app-primary)]/30
        "
      >
        {trigger ? (
          trigger
        ) : (
          <span
            aria-hidden="true"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              gap-[3px]

              rounded-xl

              text-[var(--app-text-muted)]

              transition-colors
              duration-200

              hover:bg-[var(--app-surface-muted)]
              hover:text-[var(--app-text)]
            "
          >
            <span className="h-1 w-1 rounded-full bg-current" />
            <span className="h-1 w-1 rounded-full bg-current" />
            <span className="h-1 w-1 rounded-full bg-current" />
          </span>
        )}
      </button>

      {/*=======================================================
        Menu
      =======================================================*/}
      {isOpen && (
        <div
          role="menu"
          className="
            absolute
            right-0
            top-full
            z-50
            mt-2

            min-w-[150px]

            overflow-hidden
            rounded-xl
            border
            border-[var(--app-border)]
            bg-[var(--app-surface)]
            p-1.5

            shadow-lg
          "
        >
          {React.Children.map(
            children,
            (
              child
            ) => {
              if (
                !React.isValidElement(
                  child
                )
              ) {
                return child;
              }

              return React.cloneElement(
                child,
                {
                  closeMenu,
                }
              );
            }
          )}
        </div>
      )}
    </div>
  );
};

export default AppActionMenu;