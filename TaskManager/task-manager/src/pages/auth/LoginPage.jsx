import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import AuthForm from '@/components/form/AuthForm';

import {
  useAuth,
} from '@/hooks/useAuth';

import {
  useForm,
} from '@/hooks/useForm';

import {
  login as loginApi,
} from '@/services/api';

import {
  LOGIN_FIELDS,
} from '@/utils/auth/authFields';

import {
  getLoginFormState,
} from '@/utils/formStates';

import {
  dismissToast,
  showError,
  showLoading,
  showSuccess,
} from '@/utils/toastHelpers';

import {
  getPreferences,
} from '@/utils/userPreferences';

/*===========================================================
  LoginPage:
  => Authenticates the user.
  => Stores the access token and authenticated user.
  => Displays a session-expired message when redirected
     after refresh-token failure.
===========================================================*/
const LoginPage = () => {
  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    sessionExpired,
    setSessionExpired,
  ] = useState(false);

  const [
    searchParams,
  ] = useSearchParams();

  const navigate =
    useNavigate();

  const {
    login,
  } = useAuth();

  const form =
    useForm(
      LOGIN_FIELDS,
      getLoginFormState
    );

  /*===========================================================
    Session-expired message:
    => Supports sessionStorage used by the Axios interceptor.
    => Also supports the older URL query-string approach.

    Supported URL:
    /login?reason=session_expired
  ===========================================================*/
  useEffect(() => {
    const storedSessionExpired =
      sessionStorage.getItem(
        'sessionExpired'
      ) === 'true';

    const querySessionExpired =
      searchParams.get(
        'reason'
      ) === 'session_expired';

    if (
      !storedSessionExpired &&
      !querySessionExpired
    ) {
      return;
    }

    setSessionExpired(true);

    showError(
      'Your session has expired. Please sign in again.'
    );

    sessionStorage.removeItem(
      'sessionExpired'
    );
  }, [
    searchParams,
  ]);

  /*===========================================================
    handleLogin:
    => Sends credentials to the login endpoint.
    => Saves the returned access token and user.
    => Redirects to the user's preferred start page.
  ===========================================================*/
  const handleLogin =
    useCallback(
      async (
        data
      ) => {
        setIsLoading(true);

        const loadingToastId =
          showLoading(
            'Logging in...'
          );

        try {
          const response =
            await loginApi(
              data
            );

          const {
            accessToken,
            user,
          } = response.data;

          login({
            token:
              accessToken,

            user,
          });

          dismissToast(
            loadingToastId
          );

          showSuccess(
            'Welcome back!'
          );

          /*
            Remove any previous session-expiration state after
            a successful login.
          */
          setSessionExpired(false);

          sessionStorage.removeItem(
            'sessionExpired'
          );

          const {
            defaultStartPage,
          } = getPreferences();

          navigate(
            defaultStartPage ||
            '/',
            {
              replace:
                true,
            }
          );
        } catch (
        requestError
        ) {
          dismissToast(
            loadingToastId
          );

          const message =
            requestError
              ?.response
              ?.data
              ?.message ||
            requestError
              ?.response
              ?.data
              ?.error ||
            'Invalid credentials.';

          showError(
            message
          );

          console.error(
            'Login error:',
            requestError
          );
        } finally {
          setIsLoading(
            false
          );
        }
      },
      [
        login,
        navigate,
      ]
    );

  return (
    <AuthForm
      mode="login"
      title="Welcome Back"
      fields={
        LOGIN_FIELDS
      }
      form={form}
      onSubmit={
        handleLogin
      }
      isLoading={
        isLoading
      }
      submitText="Login"
      loadingText="Logging in..."
      error={null}
      extraContent={
        sessionExpired ? (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-100 p-3 text-center text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
            Your session expired. Please log in again.
          </div>
        ) : null
      }
      footer={
        <>
          <div className="mb-2 flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm text-[var(--app-primary)] hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <span className="text-[var(--app-text-muted)]">
            Don’t have an account?{' '}
          </span>

          <Link
            to="/register"
            className="font-medium text-[var(--app-primary)] hover:underline"
          >
            Register
          </Link>
        </>
      }
    />
  );
};

export default LoginPage;