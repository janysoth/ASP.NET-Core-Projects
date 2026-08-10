import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  applyTheme,
  getPreferences,
  savePreferences,
} from '../../utils/userPreferences';

const THEMES = [
  {
    value: 'light',
    label: '☀️',
  },
  {
    value: 'dark',
    label: '🌙',
  },
];

const AUTO_HIDE_DELAY = 3000;

/*===========================================================
  FloatingThemeBar:
  => Lets the user switch between light and dark themes.
  => Automatically fades after a short period of inactivity.
  => Reappears on mouse, touch, keyboard, hover, or focus.
===========================================================*/
const FloatingThemeBar = () => {
  const [
    theme,
    setTheme,
  ] = useState(
    getPreferences().theme
  );

  const [
    isVisible,
    setIsVisible,
  ] = useState(true);

  const hideTimerRef =
    useRef(null);

  /*===========================================================
    Apply and save theme
  ===========================================================*/
  useEffect(() => {
    const preferences =
      getPreferences();

    savePreferences({
      ...preferences,
      theme,
    });

    applyTheme(theme);
  }, [
    theme,
  ]);

  /*===========================================================
    clearHideTimer:
    => Clears the current auto-hide timer.
  ===========================================================*/
  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(
        hideTimerRef.current
      );

      hideTimerRef.current = null;
    }
  }, []);

  /*===========================================================
    startHideTimer:
    => Starts a fresh countdown before fading the bar.
  ===========================================================*/
  const startHideTimer = useCallback(() => {
    clearHideTimer();

    hideTimerRef.current =
      window.setTimeout(() => {
        setIsVisible(false);
      }, AUTO_HIDE_DELAY);
  }, [clearHideTimer]);

  /*===========================================================
    showThemeBar:
    => Makes the bar visible and restarts the hide timer.
  ===========================================================*/
  const showThemeBar = useCallback(() => {
    setIsVisible(true);
    startHideTimer();
  }, [startHideTimer]);

  /*===========================================================
    Global user activity:
    => Reveals the theme bar when the user interacts with
       the application.
  ===========================================================*/
  useEffect(() => {
    const handleActivity = () => {
      showThemeBar();
    };

    const activityEvents = [
      'mousemove',
      'touchstart',
      'keydown',
    ];

    activityEvents.forEach(
      (eventName) => {
        window.addEventListener(
          eventName,
          handleActivity,
          eventName ===
            'touchstart'
            ? {
              passive: true,
            }
            : undefined
        );
      }
    );

    startHideTimer();

    return () => {
      activityEvents.forEach(
        (eventName) => {
          window.removeEventListener(
            eventName,
            handleActivity
          );
        }
      );

      clearHideTimer();
    };
  }, [
    showThemeBar,
    startHideTimer,
    clearHideTimer,
  ]);

  /*===========================================================
    handleMouseEnter:
    => Keeps the theme bar visible while hovering.
  ===========================================================*/
  const handleMouseEnter = () => {
    clearHideTimer();
    setIsVisible(true);
  };

  /*===========================================================
    handleMouseLeave:
    => Restarts the hide timer after hover ends.
  ===========================================================*/
  const handleMouseLeave = () => {
    startHideTimer();
  };

  /*===========================================================
    handleFocus:
    => Keeps the bar visible for keyboard users.
  ===========================================================*/
  const handleFocus = () => {
    clearHideTimer();
    setIsVisible(true);
  };

  /*===========================================================
    handleBlur:
    => Restarts the hide timer when keyboard focus leaves.
  ===========================================================*/
  const handleBlur = () => {
    startHideTimer();
  };

  return (
    <div
      onMouseEnter={
        handleMouseEnter
      }
      onMouseLeave={
        handleMouseLeave
      }
      onFocusCapture={
        handleFocus
      }
      onBlurCapture={
        handleBlur
      }
      className={`
        fixed bottom-3 right-3 z-50
        rounded-full
        border border-[var(--app-border)]
        p-1
        backdrop-blur-sm
        transition-all
        duration-300

        ${isVisible
          ? 'bg-[var(--app-surface)]/95 opacity-100 shadow-md'
          : 'bg-[var(--app-surface)]/10 opacity-10 shadow-none'
        }

        hover:bg-[var(--app-surface)]/95
        hover:opacity-100
        hover:shadow-lg

        focus-within:bg-[var(--app-surface)]/95
        focus-within:opacity-100
        focus-within:shadow-lg
      `}
    >
      <div className="flex items-center gap-1">
        {THEMES.map(
          (item) => (
            <button
              key={
                item.value
              }
              type="button"
              title={
                item.value
              }
              aria-label={`Use ${item.value} theme`}
              onClick={() => {
                setTheme(
                  item.value
                );

                showThemeBar();
              }}
              className={`
                flex h-8 w-8
                items-center
                justify-center
                rounded-full
                text-base
                transition-all
                duration-200

                hover:scale-110
                active:scale-95

                ${theme ===
                  item.value
                  ? 'bg-[var(--app-primary)] text-white shadow-sm'
                  : 'text-[var(--app-text)] hover:bg-[var(--app-surface-muted)]'
                }
              `}
            >
              {
                item.label
              }
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default FloatingThemeBar;