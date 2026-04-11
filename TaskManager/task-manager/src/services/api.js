import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5295/api/',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to attach token automatically
api.interceptors.request.use((config) => {
  // Your AuthContext uses 'token' as the key
  const token = localStorage.getItem('token');

  const isProtectedRoute = !config.url?.includes('auth/');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    if (isProtectedRoute) {
      console.log('✅ Token attached to:', config.url);
    }
  } else if (isProtectedRoute) {
    console.warn('⚠️ No token for protected route:', config.url);
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Register user
export const register = async (data) => {
  return await api.post('auth/register', data);
};

// Login user
export const login = async (data) => {
  return await api.post('auth/login', data);
};

// Get user info
export const getUserInfo = async (token) => {
  return await api.get('auth/get-user-info', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Logout user
export const logout = async () => {
  return await api.post('auth/logout');
};

// Todos API - Note: Fixed paths (removed leading slashes to match baseURL)

// GET /api/todos
export const getTodos = () => api.get('todos');

// POST /api/todos/create-todo
export const createTodo = (data) => api.post('todos/create-todo', data);

// PATCH /api/todos/{id}
export const patchTodo = (id, data) => api.patch(`todos/${id}`, data);

// DELETE /api/todos/{id}
export const deleteTodo = (id) => api.delete(`todos/${id}`);

// DELETE ALL /api/todos/delete-all
export const deleteAllTodos = () => api.delete('todos/delete-all');

export const changePassword = async (data, token) => {
  return await api.post('auth/change-password', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const forgotPassword = async (data) => {
  return await api.post('auth/forgot-password', data);
};

export const resetPassword = async (data) => {
  return await api.post('auth/reset-password', data);
};