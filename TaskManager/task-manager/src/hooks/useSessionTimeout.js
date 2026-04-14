import { useCallback, useEffect, useRef, useState } from 'react';
import {
  authStorage,
  calculateSessionRemaining,
} from '../utils/authHelpers';
import { MINUTE, SECOND } from '../utils/constants';

const SESSION_TIMEOUT = 120 * MINUTE;
const WARNING_BEFORE_TIMEOUT = 1 * MINUTE;
const CHECK_INTERVAL = 30 * SECOND;

export const useSessionTimeout = ({ user, onLogout }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef(null);

  // =========================
  // Cleanup timers
  // =========================
  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // =========================
  // Activity tracker
  // =========================
  const updateActivity = useCallback(() => {
    const now = Date.now();

    lastActivityRef.current = now;
    authStorage.setLastActivity(now);

    setShowWarning(false);
    setTimeRemaining(null);
  }, []);

  // =========================
  // Remaining session time
  // =========================
  const getTimeRemaining = useCallback(() => {
    const lastActivity =
      authStorage.getLastActivity() || lastActivityRef.current;

    return calculateSessionRemaining(
      lastActivity,
      SESSION_TIMEOUT
    );
  }, []);

  // =========================
  // Start watcher
  // =========================
  const startWatcher = useCallback(() => {
    clearTimers();

    if (!user) return;

    intervalRef.current = setInterval(() => {
      const remaining = getTimeRemaining();

      if (remaining <= 0) {
        onLogout();
        return;
      }

      if (remaining <= WARNING_BEFORE_TIMEOUT) {
        setShowWarning(true);
        setTimeRemaining(remaining);
      }
    }, CHECK_INTERVAL);
  }, [user, getTimeRemaining, onLogout, clearTimers]);

  // =========================
  // Start / stop session watcher
  // =========================
  useEffect(() => {
    if (!user) {
      clearTimers();
      return;
    }

    startWatcher();

    return clearTimers;
  }, [user, startWatcher, clearTimers]);

  // =========================
  // Browser activity listeners
  // =========================
  useEffect(() => {
    if (!user) return;

    const events = [
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    const handleActivity = () => updateActivity();

    events.forEach((event) =>
      window.addEventListener(event, handleActivity, true)
    );

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity, true)
      );
    };
  }, [user, updateActivity]);

  // =========================
  // Restore last activity once
  // =========================
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