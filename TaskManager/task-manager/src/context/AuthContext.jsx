import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';

// Constants
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const SESSION_TIMEOUT = 2 * HOUR; // 6 hours in milliseconds
const INACTIVITY_CHECK_INTERVAL = MINUTE; // Check every minute
const WARNING_BEFORE_TIMEOUT = 5 * MINUTE; // Warn 5 minutes before

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

  // Use refs to track activity without causing re-renders
  const lastActivityRef = useRef(Date.now());
  const warningTimerRef = useRef(null);
  const logoutTimerRef = useRef(null);
  const checkIntervalRef = useRef(null);

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    localStorage.setItem('lastActivity', lastActivityRef.current.toString());

    // Clear warning if user becomes active again
    if (showWarning) {
      setShowWarning(false);
    }
  }, [showWarning]);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
  }, []);

  // Perform logout
  const performLogout = useCallback((reason = 'timeout') => {
    clearTimers();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    setUser(null);
    setShowWarning(false);

    if (reason === 'timeout') {
      // Optional: Show alert or redirect with message
      window.location.href = '/login?reason=session_expired';
    }
  }, [clearTimers]);

  // Setup activity listeners
  useEffect(() => {
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      if (user) {
        updateActivity();
      }
    };

    // Add listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, true);
    });

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity, true);
      });
    };
  }, [user, updateActivity]);

  // Setup session timeout check
  const setupSessionTimeout = useCallback(() => {
    clearTimers();

    if (!user) return;

    const now = Date.now();
    const lastActivity = parseInt(localStorage.getItem('lastActivity') || now, 10);
    const timeElapsed = now - lastActivity;
    const timeRemaining = SESSION_TIMEOUT - timeElapsed;

    // If already expired, logout immediately
    if (timeRemaining <= 0) {
      performLogout('timeout');
      return;
    }

    // Set warning timer (5 minutes before expiration)
    const warningTime = Math.max(0, timeRemaining - WARNING_BEFORE_TIMEOUT);
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, warningTime);

    // Set logout timer
    logoutTimerRef.current = setTimeout(() => {
      performLogout('timeout');
    }, timeRemaining);

    // Periodic check (backup in case timers fail)
    checkIntervalRef.current = setInterval(() => {
      const currentLastActivity = parseInt(localStorage.getItem('lastActivity') || Date.now(), 10);
      if (Date.now() - currentLastActivity >= SESSION_TIMEOUT) {
        performLogout('timeout');
      }
    }, INACTIVITY_CHECK_INTERVAL);

  }, [user, performLogout, clearTimers]);

  // Restore session on app load
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const lastActivity = localStorage.getItem('lastActivity');

      if (token && storedUser) {
        // Check if session expired while app was closed
        if (lastActivity) {
          const timeElapsed = Date.now() - parseInt(lastActivity, 10);
          if (timeElapsed >= SESSION_TIMEOUT) {
            // Session expired
            performLogout('timeout');
          } else {
            // Valid session, restore
            setUser(JSON.parse(storedUser));
            lastActivityRef.current = parseInt(lastActivity, 10);
          }
        } else {
          // No last activity recorded, start fresh
          setUser(JSON.parse(storedUser));
          updateActivity();
        }
      }
    } catch (error) {
      console.error('Failed to restore auth state:', error);
      performLogout('error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Setup timeout when user changes
  useEffect(() => {
    if (user) {
      setupSessionTimeout();
    } else {
      clearTimers();
    }

    return () => clearTimers();
  }, [user, setupSessionTimeout, clearTimers]);

  const login = useCallback((data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    updateActivity(); // Set initial activity timestamp
    setUser(data.user);
  }, [updateActivity]);

  const logout = useCallback(() => {
    performLogout('manual');
  }, [performLogout]);

  const extendSession = useCallback(() => {
    updateActivity();
    setupSessionTimeout();
    setShowWarning(false);
  }, [updateActivity, setupSessionTimeout]);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    extendSession,
    showWarning,
    timeRemaining: showWarning ? WARNING_BEFORE_TIMEOUT : null,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};