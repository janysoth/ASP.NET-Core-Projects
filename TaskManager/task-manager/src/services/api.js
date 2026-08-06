import axios from 'axios';

import {
  authStorage,
} from '@/utils/auth/authHelpers';

/*===========================================================
  API configuration
===========================================================*/
const API_BASE_URL =
  'http://localhost:5295/api/';

/*===========================================================
  api:
  => Main Axios client used throughout the application.
  => Sends the HttpOnly refresh-token cookie when needed.
===========================================================*/
const api = axios.create({
  baseURL:
    API_BASE_URL,

  withCredentials:
    true,

  headers: {
    'Content-Type':
      'application/json',
  },
});

/*===========================================================
  refreshClient:
  => Separate Axios client used only for token refreshes.

  IMPORTANT:
  => It does not use the main response interceptor.
  => This prevents an infinite refresh loop if /auth/refresh
     itself returns 401.
===========================================================*/
const refreshClient =
  axios.create({
    baseURL:
      API_BASE_URL,

    withCredentials:
      true,

    headers: {
      'Content-Type':
        'application/json',
    },
  });

/*===========================================================
  Refresh request coordination:
  => Only one refresh request may run at a time.
  => Other failed requests wait for that same refresh.
===========================================================*/
let refreshPromise = null;

/*===========================================================
  isAuthPublicRequest:
  => Identifies authentication requests that should not
     trigger automatic token refresh behavior.
===========================================================*/
const isAuthPublicRequest = (
  url = ''
) => {
  return (
    url.includes(
      'auth/login'
    ) ||
    url.includes(
      'auth/register'
    ) ||
    url.includes(
      'auth/forgot-password'
    ) ||
    url.includes(
      'auth/reset-password'
    ) ||
    url.includes(
      'auth/check-email'
    ) ||
    url.includes(
      'auth/refresh'
    )
  );
};

/*===========================================================
  endClientSession:
  => Clears authentication state.
  => Redirects to login when refresh is no longer possible.
===========================================================*/
const endClientSession = () => {
  authStorage.clear();

  sessionStorage.setItem(
    'sessionExpired',
    'true'
  );

  if (
    window.location.pathname !== '/login'
  ) {
    window.location.replace('/login');
  }
};

/*===========================================================
  refreshAccessToken:
  => Uses the HttpOnly refresh-token cookie.
  => Rotates the refresh token through the backend.
  => Saves and returns the new JWT access token.
===========================================================*/
const refreshAccessToken =
  async () => {
    if (!refreshPromise) {
      refreshPromise =
        refreshClient
          .post(
            'auth/refresh'
          )
          .then(
            (response) => {
              const newAccessToken =
                response.data
                  ?.accessToken;

              if (
                !newAccessToken
              ) {
                throw new Error(
                  'The refresh response did not contain an access token.'
                );
              }

              authStorage.setToken(
                newAccessToken
              );

              return newAccessToken;
            }
          )
          .finally(() => {
            refreshPromise = null;
          });
    }

    return refreshPromise;
  };

/*===========================================================
  Request interceptor:
  => Reads the newest access token before every request.
  => Automatically adds the Bearer header.
===========================================================*/
api.interceptors.request.use(
  (config) => {
    const token =
      authStorage.getToken();

    if (token) {
      config.headers =
        config.headers ?? {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) =>
    Promise.reject(error)
);

/*===========================================================
  Response interceptor:
  => Handles expired access tokens.

  Flow:
  1. Protected request receives 401.
  2. Refresh access token using HttpOnly cookie.
  3. Store replacement access token.
  4. Retry the original request once.
  5. End the session if refresh fails.
===========================================================*/
api.interceptors.response.use(
  (response) =>
    response,

  async (error) => {
    const originalRequest =
      error.config;

    const status =
      error.response?.status;

    const requestUrl =
      originalRequest?.url ?? '';

    const shouldAttemptRefresh =
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthPublicRequest(
        requestUrl
      );

    if (
      !shouldAttemptRefresh
    ) {
      return Promise.reject(
        error
      );
    }

    originalRequest._retry =
      true;

    try {
      const newAccessToken =
        await refreshAccessToken();

      originalRequest.headers =
        originalRequest.headers ??
        {};

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      /*
        Retry using the same Axios instance.
      */
      return api(
        originalRequest
      );
    } catch (refreshError) {
      endClientSession();

      return Promise.reject(
        refreshError
      );
    }
  }
);

/*===========================================================
  Authentication API
===========================================================*/

/*===========================================================
  register:
  => Registers a user.
  => withCredentials allows the browser to receive and retain
     the refresh-token cookie.
===========================================================*/
export const register = async (
  formData
) => {
  const response =
    await api.post(
      'auth/register',
      formData,
      {
        headers: {
          'Content-Type':
            'multipart/form-data',
        },
      }
    );

  return response.data;
};

/*===========================================================
  login:
  => Logs in and receives:
     - Access token in the response body
     - Refresh token in an HttpOnly cookie
===========================================================*/
export const login = async (
  formData
) => {
  return await api.post(
    'auth/login',
    formData
  );
};

/*===========================================================
  getUserInfo
===========================================================*/
export const getUserInfo = async (
  token
) => {
  return await api.get(
    'auth/get-user-info',
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );
};

/*===========================================================
  logout:
  => Backend revokes the refresh token and clears its cookie.
===========================================================*/
export const logout = async () => {
  return await api.post(
    'auth/logout'
  );
};

/*===========================================================
  Todos API
===========================================================*/
export const getTodos = () =>
  api.get('todos');

export const createTodo = (
  data
) =>
  api.post(
    'todos/create-todo',
    data
  );

export const patchTodo = (
  id,
  data
) =>
  api.patch(
    `todos/${id}`,
    data
  );

export const deleteTodo = (
  id
) =>
  api.delete(
    `todos/${id}`
  );

export const deleteAllTodos = () =>
  api.delete(
    'todos/delete-all'
  );

/*===========================================================
  Account and password API
===========================================================*/
export const changePassword =
  async (
    data,
    token
  ) => {
    return await api.post(
      'auth/change-password',
      data,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );
  };

export const forgotPassword =
  async (
    data
  ) => {
    return await api.post(
      'auth/forgot-password',
      data
    );
  };

export const resetPassword =
  async (
    data
  ) => {
    return await api.post(
      'auth/reset-password',
      data
    );
  };

export const checkEmailExists = (
  email
) => {
  return api.get(
    'auth/check-email',
    {
      params: {
        email,
      },
    }
  );
};

export const updateProfileImage =
  async (
    formData,
    token
  ) => {
    return await api.post(
      'auth/update-profile-image',
      formData,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,

          'Content-Type':
            'multipart/form-data',
        },
      }
    );
  };

export const updateProfileInfo =
  async (
    data,
    token
  ) => {
    return await api.patch(
      'auth/update-profile-info',
      data,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );
  };

export default api;