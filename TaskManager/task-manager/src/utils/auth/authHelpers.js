export const authStorage = {
  /*=========================================================
    getToken:
    => Gets the current JWT access token.
  =========================================================*/
  getToken: () =>
    localStorage.getItem('token'),

  /*=========================================================
    setToken:
    => Replaces only the access token.
    => Used after a successful refresh.
  =========================================================*/
  setToken: (token) => {
    if (!token) {
      localStorage.removeItem('token');
      return;
    }

    localStorage.setItem(
      'token',
      token
    );
  },

  /*=========================================================
    getUser:
    => Safely reads the stored authenticated user.
  =========================================================*/
  getUser: () => {
    try {
      const storedUser =
        localStorage.getItem('user');

      return storedUser
        ? JSON.parse(storedUser)
        : null;
    } catch {
      return null;
    }
  },

  /*=========================================================
    setUser:
    => Replaces only the stored user.
  =========================================================*/
  setUser: (user) => {
    if (!user) {
      localStorage.removeItem('user');
      return;
    }

    localStorage.setItem(
      'user',
      JSON.stringify(user)
    );
  },

  /*=========================================================
    getLastActivity:
    => Reads the most recent activity timestamp.
  =========================================================*/
  getLastActivity: () => {
    const value =
      localStorage.getItem(
        'lastActivity'
      );

    return value
      ? Number.parseInt(value, 10)
      : null;
  },

  /*=========================================================
    setSession:
    => Saves a complete authenticated session.
  =========================================================*/
  setSession: ({
    token,
    user,
  }) => {
    localStorage.setItem(
      'token',
      token
    );

    localStorage.setItem(
      'user',
      JSON.stringify(user)
    );
  },

  /*=========================================================
    setLastActivity:
    => Saves the most recent activity timestamp.
  =========================================================*/
  setLastActivity: (time) => {
    localStorage.setItem(
      'lastActivity',
      time.toString()
    );
  },

  /*=========================================================
    clear:
    => Removes all client-side authentication state.
  =========================================================*/
  clear: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem(
      'lastActivity'
    );
  },
};

export const calculateSessionRemaining = (
  lastActivity,
  sessionTimeout
) => {
  return (
    sessionTimeout -
    (Date.now() - lastActivity)
  );
};