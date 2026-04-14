import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  authStorage,
  calculateSessionRemaining,
} from '../utils/authHelpers';
import { MINUTE, SECOND } from '../utils/constants';

// =========================
// Constants
// =========================
const SESSION_TIMEOUT = 120 * MINUTE; // 2 hours
const WARNING_BEFORE_TIMEOUT = 1 * MINUTE;
const CHECK_INTERVAL = 30 * SECOND;

// =========================
// Context
// =========================
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef(null);

  // =========================
  // Helpers
  // =========================
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

  // =========================
  // Logout
  // =========================
  const performLogout = useCallback(() => {
    clearTimers();
    authStorage.clear();

    setUser(null);
    setShowWarning(false);
    setTimeRemaining(null);
  }, [clearTimers]);

  const logout = useCallback(() => {
    performLogout();
  }, [performLogout]);

  // =========================
  // Login
  // =========================
  const login = useCallback(
    ({ token, user }) => {
      authStorage.setSession({ token, user });
      updateActivity();
      setUser(user);
    },
    [updateActivity]
  );

  // =========================
  // Session watcher
  // =========================
  const startSessionWatcher = useCallback(() => {
    clearTimers();

    if (!user) return;

    intervalRef.current = setInterval(() => {
      const remaining = getTimeRemaining();

      if (remaining <= 0) {
        performLogout();
        return;
      }

      if (remaining <= WARNING_BEFORE_TIMEOUT) {
        setShowWarning(true);
        setTimeRemaining(remaining);
      }
    }, CHECK_INTERVAL);
  }, [user, getTimeRemaining, performLogout, clearTimers]);

  useEffect(() => {
    if (user) {
      startSessionWatcher();
    } else {
      clearTimers();
    }

    return clearTimers;
  }, [user, startSessionWatcher, clearTimers]);

  // =========================
  // Activity listeners
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

    return () =>
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity, true)
      );
  }, [user, updateActivity]);

  // =========================
  // Restore session on mount
  // =========================
  useEffect(() => {
    const token = authStorage.getToken();
    const storedUser = authStorage.getUser();
    const lastActivity = authStorage.getLastActivity();

    if (token && storedUser) {
      const remaining = calculateSessionRemaining(
        lastActivity || Date.now(),
        SESSION_TIMEOUT
      );

      if (remaining <= 0) {
        performLogout();
      } else {
        setUser(storedUser);
        lastActivityRef.current = lastActivity || Date.now();
      }
    }

    setLoading(false);
  }, [performLogout]);

  // =========================
  // Context value
  // =========================
  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    token: authStorage.getToken(),
    login,
    logout,
    extendSession: updateActivity,
    showWarning,
    timeRemaining,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};