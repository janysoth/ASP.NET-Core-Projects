import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

// =========================
// Constants
// =========================
const SECOND = 1000;
const MINUTE = 60 * SECOND;

const SESSION_TIMEOUT = 120 * MINUTE; // 2 hours
const WARNING_BEFORE_TIMEOUT = 5 * MINUTE;
const CHECK_INTERVAL = 30 * SECOND; // 1 second (for live countdown)

// =========================
// Storage Helpers
// =========================
const storage = {
  getToken: () => localStorage.getItem('token'),

  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
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

  const performLogout = useCallback(
    (reason = 'timeout') => {
      clearTimers();
      storage.clear();

      setUser(null);
      setShowWarning(false);
      setTimeRemaining(null);

      // Always redirect
      window.location.href =
        reason === 'timeout'
          ? '/login?reason=session_expired'
          : '/login';
    },
    [clearTimers]
  );

  const getTimeRemaining = useCallback(() => {
    const lastActivity =
      storage.getLastActivity() || lastActivityRef.current;

    return SESSION_TIMEOUT - (Date.now() - lastActivity);
  }, []);

  // =========================
  // Session Timer (Core Logic)
  // =========================
  const startSessionWatcher = useCallback(() => {
    clearTimers();

    if (!user) return;

    intervalRef.current = setInterval(() => {
      const remaining = getTimeRemaining();

      // Session expired
      if (remaining <= 0) {
        performLogout('timeout');
        return;
      }

      // Show warning window
      if (remaining <= WARNING_BEFORE_TIMEOUT) {
        setShowWarning(true);
        setTimeRemaining(remaining);
      }
    }, CHECK_INTERVAL);
  }, [user, getTimeRemaining, performLogout, clearTimers]);

  // =========================
  // Activity Listeners
  // =========================
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

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
  // Restore Session
  // =========================
  useEffect(() => {
    try {
      const token = storage.getToken();
      const storedUser = storage.getUser();
      const lastActivity = storage.getLastActivity();

      if (token && storedUser) {
        if (lastActivity) {
          const elapsed = Date.now() - lastActivity;

          if (elapsed >= SESSION_TIMEOUT) {
            performLogout('timeout');
          } else {
            setUser(storedUser);
            lastActivityRef.current = lastActivity;
          }
        } else {
          setUser(storedUser);
          updateActivity();
        }
      }
    } catch (error) {
      console.error('Auth restore failed:', error);
      performLogout('error');
    } finally {
      setLoading(false);
    }
  }, [performLogout, updateActivity]);

  // =========================
  // Start / Stop watcher
  // =========================
  useEffect(() => {
    if (user) {
      startSessionWatcher();
    } else {
      clearTimers();
    }

    return clearTimers;
  }, [user, startSessionWatcher, clearTimers]);

  // =========================
  // Public API
  // =========================
  const login = useCallback(
    ({ token, user }) => {
      storage.setSession({ token, user });
      updateActivity();
      setUser(user);
    },
    [updateActivity]
  );

  const logout = useCallback(() => {
    performLogout('manual');
  }, [performLogout]);

  const extendSession = useCallback(() => {
    updateActivity();
  }, [updateActivity]);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    token: storage.getToken(),
    extendSession,
    showWarning,
    timeRemaining, // ✅ real-time ms
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};