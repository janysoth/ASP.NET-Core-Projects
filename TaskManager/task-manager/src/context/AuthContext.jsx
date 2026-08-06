import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { authStorage } from '../utils/auth/authHelpers';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    authStorage.clear();
    setUser(null);
  }, []);

  const login = useCallback(({ token, user }) => {
    authStorage.setSession({ token, user });
    setUser(user);
  }, []);

  // ✅ NEW: update user without logging in again
  const updateUser = useCallback((updatedUser) => {
    const token = authStorage.getToken();

    authStorage.setSession({
      token,
      user: updatedUser,
    });

    setUser(updatedUser);
  }, []);

  const {
    showWarning,
    timeRemaining,
    extendSession,
  } = useSessionTimeout({
    user,
    onLogout: logout,
  });

  useEffect(() => {
    const token = authStorage.getToken();
    const storedUser = authStorage.getUser();

    if (token && storedUser) {
      setUser(storedUser);
    }

    setLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      token: authStorage.getToken(),
      isAuthenticated: !!user,
      login,
      logout,
      updateUser, // ✅ expose it
      extendSession,
      showWarning,
      timeRemaining,
    }),
    [
      user,
      loading,
      login,
      logout,
      updateUser,
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