import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { MINUTE, SECOND } from '../utils/helpers';

// =========================
// Constants
// =========================
const SESSION_TIMEOUT = 120 * MINUTE; // 2 hours
const WARNING_BEFORE_TIMEOUT = 1 * MINUTE;
const CHECK_INTERVAL = 30 * SECOND;

// =========================
// Storage Helpers
// =========================
const storage = {
  getToken: () => localStorage.getItem('token'),
  getUser: () => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  },
  getLastActivity: () => {
    const value = localStorage.getItem('lastActivity');
    return value ? parseInt(value, 10) : null;
  },
  setSession: ({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  setLastActivity: (time) => {
    localStorage.setItem('lastActivity', time.toString());
  },
  clear: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
  },
};

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
    storage.setLastActivity(now);
    setShowWarning(false);
    setTimeRemaining(null);
  }, []);

  const getTimeRemaining = useCallback(() => {
    const lastActivity = storage.getLastActivity() || lastActivityRef.current;
    return SESSION_TIMEOUT - (Date.now() - lastActivity);
  }, []);

  // =========================
  // Logout
  // =========================
  const performLogout = useCallback(() => {
    clearTimers();
    storage.clear();
    setUser(null);
    setShowWarning(false);
    setTimeRemaining(null);
  }, [clearTimers]);

  const logout = useCallback(() => {
    performLogout(); // SPA-style logout
  }, [performLogout]);

  // =========================
  // Login
  // =========================
  const login = useCallback(
    ({ token, user }) => {
      storage.setSession({ token, user });
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
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => updateActivity();
    events.forEach((e) => window.addEventListener(e, handleActivity, true));
    return () => events.forEach((e) => window.removeEventListener(e, handleActivity, true));
  }, [user, updateActivity]);

  // =========================
  // Restore session on mount
  // =========================
  useEffect(() => {
    const token = storage.getToken();
    const storedUser = storage.getUser();
    const lastActivity = storage.getLastActivity();

    if (token && storedUser) {
      if (lastActivity && Date.now() - lastActivity >= SESSION_TIMEOUT) {
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
    login,
    logout,
    token: storage.getToken(),
    extendSession: updateActivity,
    showWarning,
    timeRemaining,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};