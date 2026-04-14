import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { authStorage } from '../utils/authHelpers';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // =========================
  // Stable logout
  // =========================
  const logout = useCallback(() => {
    authStorage.clear();
    setUser(null);
  }, []);

  const login = useCallback(({ token, user }) => {
    authStorage.setSession({ token, user });
    setUser(user);
  }, []);

  // =========================
  // Session timeout hook
  // =========================
  const {
    showWarning,
    timeRemaining,
    extendSession,
  } = useSessionTimeout({
    user,
    onLogout: logout,
  });

  // =========================
  // Restore session once
  // =========================
  useEffect(() => {
    const token = authStorage.getToken();
    const storedUser = authStorage.getUser();

    if (token && storedUser) {
      setUser(storedUser);
    }

    setLoading(false);
  }, []);

  // =========================
  // Stable context value
  // =========================
  const value = useMemo(
    () => ({
      user,
      loading,
      token: authStorage.getToken(),
      isAuthenticated: !!user,
      login,
      logout,
      extendSession,
      showWarning,
      timeRemaining,
    }),
    [
      user,
      loading,
      login,
      logout,
      extendSession,
      showWarning,
      timeRemaining,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};