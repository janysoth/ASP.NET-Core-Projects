import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  authStorage,
  calculateSessionRemaining,
} from '@/utils/auth/authHelpers';

import {
  MINUTE,
  SECOND,
} from '@/utils/constants';

import {
  getPreferences,
} from '@/utils/userPreferences';

/*===========================================================
  Session timing:
  => Logs the user out after 120 minutes of inactivity.
  => Checks the remaining time once per second.
  => Limits activity writes to at most once per second.
===========================================================*/
const SESSION_TIMEOUT =
  120 * MINUTE;

const CHECK_INTERVAL =
  1 * SECOND;

const ACTIVITY_UPDATE_INTERVAL =
  1 * SECOND;

/*===========================================================
  useSessionTimeout:
  => Tracks user inactivity.
  => Shows a warning before automatic logout.
  => Requires an explicit choice once the warning appears.
===========================================================*/
export const useSessionTimeout = ({
  user,
  onLogout,
}) => {
  const [
    showWarning,
    setShowWarning,
  ] = useState(false);

  const [
    timeRemaining,
    setTimeRemaining,
  ] = useState(null);

  const lastActivityRef =
    useRef(Date.now());

  const lastActivityUpdateRef =
    useRef(0);

  const intervalRef =
    useRef(null);

  /*===========================================================
    clearTimers:
    => Stops the session watcher.
  ===========================================================*/
  const clearTimers =
    useCallback(() => {
      if (
        intervalRef.current !==
        null
      ) {
        window.clearInterval(
          intervalRef.current
        );

        intervalRef.current =
          null;
      }
    }, []);

  /*===========================================================
    updateActivity:
    => Resets the inactivity clock.
    => Closes the warning modal.
    => Used directly by the Continue Session button.
  ===========================================================*/
  const updateActivity =
    useCallback(() => {
      const now =
        Date.now();

      lastActivityRef.current =
        now;

      lastActivityUpdateRef.current =
        now;

      authStorage.setLastActivity(
        now
      );

      setShowWarning(false);
      setTimeRemaining(null);
    }, []);

  /*===========================================================
    recordActivity:
    => Records normal user activity.
    => Throttles repeated events such as scrolling.
  ===========================================================*/
  const recordActivity =
    useCallback(() => {
      const now =
        Date.now();

      const timeSinceLastUpdate =
        now -
        lastActivityUpdateRef.current;

      if (
        timeSinceLastUpdate <
        ACTIVITY_UPDATE_INTERVAL
      ) {
        return;
      }

      lastActivityRef.current =
        now;

      lastActivityUpdateRef.current =
        now;

      authStorage.setLastActivity(
        now
      );
    }, []);

  /*===========================================================
    getTimeRemaining:
    => Calculates how much inactivity time remains.
  ===========================================================*/
  const getTimeRemaining =
    useCallback(() => {
      const storedLastActivity =
        authStorage.getLastActivity();

      const lastActivity =
        storedLastActivity ??
        lastActivityRef.current;

      return calculateSessionRemaining(
        lastActivity,
        SESSION_TIMEOUT
      );
    }, []);

  /*===========================================================
    getWarningBeforeTimeout:
    => Reads the user's warning preference.
    => Falls back to one minute when the preference is invalid.
    => Prevents the warning duration from exceeding the full
       inactivity timeout.
  ===========================================================*/
  const getWarningBeforeTimeout =
    useCallback(() => {
      const preferences =
        getPreferences();

      const configuredMinutes =
        Number(
          preferences
            .sessionWarningMinutes
        );

      const validMinutes =
        Number.isFinite(
          configuredMinutes
        ) &&
          configuredMinutes > 0
          ? configuredMinutes
          : 1;

      const warningDuration =
        validMinutes *
        MINUTE;

      return Math.min(
        warningDuration,
        SESSION_TIMEOUT
      );
    }, []);

  /*===========================================================
    startWatcher:
    => Checks the inactivity clock once per second.
    => Shows the warning near expiration.
    => Logs out when no time remains.
  ===========================================================*/
  const startWatcher =
    useCallback(() => {
      clearTimers();

      if (!user) {
        return;
      }

      intervalRef.current =
        window.setInterval(
          () => {
            const remaining =
              getTimeRemaining();

            const warningBeforeTimeout =
              getWarningBeforeTimeout();

            if (remaining <= 0) {
              clearTimers();

              setShowWarning(false);
              setTimeRemaining(0);

              onLogout();

              return;
            }

            if (
              remaining <=
              warningBeforeTimeout
            ) {
              setShowWarning(true);

              setTimeRemaining(
                remaining
              );

              return;
            }

            /*
              Keep stale warning state from remaining visible
              if preferences or stored activity change.
            */
            setShowWarning(false);
            setTimeRemaining(null);
          },
          CHECK_INTERVAL
        );
    }, [
      user,
      getTimeRemaining,
      getWarningBeforeTimeout,
      onLogout,
      clearTimers,
    ]);

  /*===========================================================
    Session initialization:
    => Starts watching when a user is authenticated.
    => Creates a last-activity value when one does not exist.
    => Preserves an existing timestamp across page refreshes.
  ===========================================================*/
  useEffect(() => {
    if (!user) {
      clearTimers();

      setShowWarning(false);
      setTimeRemaining(null);

      return undefined;
    }

    const storedLastActivity =
      authStorage.getLastActivity();

    if (storedLastActivity) {
      lastActivityRef.current =
        storedLastActivity;

      lastActivityUpdateRef.current =
        storedLastActivity;
    } else {
      const now =
        Date.now();

      lastActivityRef.current =
        now;

      lastActivityUpdateRef.current =
        now;

      authStorage.setLastActivity(
        now
      );
    }

    startWatcher();

    return clearTimers;
  }, [
    user,
    startWatcher,
    clearTimers,
  ]);

  /*===========================================================
    User activity:
    => Resets inactivity during normal app usage.
    => Does not extend the session while the warning is open.

    Once the warning appears, the user must explicitly choose:
    => Continue Session
    => Logout Now
  ===========================================================*/
  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const handleActivity = () => {
      if (showWarning) {
        return;
      }

      recordActivity();
    };

    const activityEvents = [
      'pointerdown',
      'keydown',
      'scroll',
      'touchstart',
    ];

    activityEvents.forEach(
      (eventName) => {
        const options =
          eventName === 'scroll' ||
            eventName === 'touchstart'
            ? {
              passive: true,
            }
            : undefined;

        window.addEventListener(
          eventName,
          handleActivity,
          options
        );
      }
    );

    return () => {
      activityEvents.forEach(
        (eventName) => {
          window.removeEventListener(
            eventName,
            handleActivity
          );
        }
      );
    };
  }, [
    user,
    showWarning,
    recordActivity,
  ]);

  return {
    showWarning,
    timeRemaining,

    /*
      Continue Session must perform a full reset rather than
      using the throttled normal-activity handler.
    */
    extendSession:
      updateActivity,
  };
};