import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5295/api/auth', // Update this based on your backend URL
});

// Register user
export const register = async (data) => {
  return await api.post('/register', data);
};

// Login user
export const login = async (data) => {
  return await api.post('/login', data);
};

// Get user info
export const getUserInfo = async (token) => {
  return await api.get('/get-user-info', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Logout user
export const logout = async () => {
  return await api.post('/logout');
};