import React, {
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
    resetHideTimer:
    => Shows the theme bar.
    => Starts a new auto-hide countdown.
  ===========================================================*/
  const resetHideTimer = () => {
    setIsVisible(true);

    if (hideTimerRef.current) {
      window.clearTimeout(
        hideTimerRef.current
      );
    }

    hideTimerRef.current =
      window.setTimeout(
        () => {
          setIsVisible(false);
        },
        AUTO_HIDE_DELAY
      );
  };

  /*===========================================================
    Global activity:
    => Reveals the theme bar when the user moves the mouse,
       touches the screen, or uses the keyboard.
  ===========================================================*/
  useEffect(() => {
    const activityEvents = [
      'mousemove',
      'touchstart',
      'keydown',
    ];

    const handleActivity = () => {
      resetHideTimer();
    };

    activityEvents.forEach(
      (eventName) => {
        window.addEventListener(
          eventName,
          handleActivity,
          {
            passive:
              eventName !==
              'keydown',
          }
        );
      }
    );

    resetHideTimer();

    return () => {
      activityEvents.forEach(
        (eventName) => {
          window.removeEventListener(
            eventName,
            handleActivity
          );
        }
      );

      if (hideTimerRef.current) {
        window.clearTimeout(
          hideTimerRef.current
        );
      }
    };
  }, []);

  return (
    <div
      onMouseEnter={() => {
        setIsVisible(true);

        if (
          hideTimerRef.current
        ) {
          window.clearTimeout(
            hideTimerRef.current
          );
        }
      }}
      onMouseLeave={
        resetHideTimer
      }
      onFocusCapture={() => {
        setIsVisible(true);

        if (
          hideTimerRef.current
        ) {
          window.clearTimeout(
            hideTimerRef.current
          );
        }
      }}
      onBlurCapture={
        resetHideTimer
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
          : 'pointer-events-none bg-[var(--app-surface)]/10 opacity-10 shadow-none'
        }

        hover:pointer-events-auto
        hover:bg-[var(--app-surface)]/95
        hover:opacity-100
        hover:shadow-lg

        focus-within:pointer-events-auto
        focus-within:bg-[var(--app-surface)]/95
        focus-within:opacity-100
        focus-within:shadow-lg
      `}
    >
      <div className="flex items-center gap-1">
        {THEMES.map(
          (item) => (
            <button
              key={item.value}
              type="button"
              title={item.value}
              aria-label={`Use ${item.value} theme`}
              onClick={() => {
                setTheme(
                  item.value
                );

                resetHideTimer();
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
              {item.label}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default FloatingThemeBar;