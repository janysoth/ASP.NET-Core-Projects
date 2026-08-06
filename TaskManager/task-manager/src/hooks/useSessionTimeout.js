import { useCallback, useEffect, useRef, useState } from 'react';

import {
  authStorage,
  calculateSessionRemaining,
} from '../utils/auth/authHelpers';

import { MINUTE, SECOND } from '../utils/constants';
import { getPreferences } from '../utils/userPreferences';

const SESSION_TIMEOUT = 120 * MINUTE;
const CHECK_INTERVAL = 1 * SECOND;

export const useSessionTimeout = ({ user, onLogout }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef(null);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const updateActivity = useCallback(() => {
    const now = Date.now();

    lastActivityRef.current = now;
    authStorage.setLastActivity(now);

    setShowWarning(false);
    setTimeRemaining(null);
  }, []);

  const getTimeRemaining = useCallback(() => {
    const lastActivity =
      authStorage.getLastActivity() || lastActivityRef.current;

    return calculateSessionRemaining(
      lastActivity,
      SESSION_TIMEOUT
    );
  }, []);

  const getWarningBeforeTimeout = useCallback(() => {
    const preferences = getPreferences();

    const minutes = Number(
      preferences.sessionWarningMinutes || 1
    );

    return minutes * MINUTE;
  }, []);

  const startWatcher = useCallback(() => {
    clearTimers();

    if (!user) return;

    intervalRef.current = setInterval(() => {
      const remaining = getTimeRemaining();
      const warningBeforeTimeout = getWarningBeforeTimeout();

      if (remaining <= 0) {
        onLogout();
        return;
      }

      if (remaining <= warningBeforeTimeout) {
        setShowWarning(true);
        setTimeRemaining(remaining);
      }
    }, CHECK_INTERVAL);
  }, [
    user,
    getTimeRemaining,
    getWarningBeforeTimeout,
    onLogout,
    clearTimers,
  ]);

  useEffect(() => {
    if (!user) {
      clearTimers();
      setShowWarning(false);
      setTimeRemaining(null);
      return;
    }

    startWatcher();

    return clearTimers;
  }, [user, startWatcher, clearTimers]);

  /*===========================================================
    User activity:
    => Resets the inactivity timer during normal app usage.
    => Does not automatically extend the session while the
       warning modal is open.
  
    IMPORTANT:
    => Once the warning appears, the user must explicitly choose:
       - Continue Session
       - Logout Now
  ===========================================================*/
  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const events = [
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    const handleActivity = () => {
      /*
        Do not let backdrop clicks, Escape, or button mouse-down
        events automatically dismiss the warning modal.
      */
      if (showWarning) {
        return;
      }

      updateActivity();
    };

    events.forEach((event) => {
      window.addEventListener(
        event,
        handleActivity
      );
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(
          event,
          handleActivity
        );
      });
    };
  }, [
    user,
    showWarning,
    updateActivity,
  ]);

  useEffect(() => {
    const lastActivity = authStorage.getLastActivity();

    if (lastActivity) {
      lastActivityRef.current = lastActivity;
    }
  }, []);

  return {
    showWarning,
    timeRemaining,
    extendSession: updateActivity,
  };
};