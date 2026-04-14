export const authStorage = {
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

export const calculateSessionRemaining = (
  lastActivity,
  sessionTimeout
) => {
  return sessionTimeout - (Date.now() - lastActivity);
};