import React, { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import AuthForm from '../../components/forms/AuthForm';

import { LOGIN_FIELDS } from '../../features/auth/authFields';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from '../../hooks/useForm';
import { login as loginApi } from '../../services/api';
import { getLoginFormState } from '../../utils/formStates';
import { getPreferences } from '../../utils/userPreferences';

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('reason') === 'session_expired';

  const navigate = useNavigate();
  const { login } = useAuth();

  const form = useForm(LOGIN_FIELDS, getLoginFormState);

  const handleLogin = useCallback(async (data) => {
    setIsLoading(true);

    const toastId = toast.loading('Logging in...', {
      style: {
        background: '#334155',
        color: '#fff',
      },
    });

    try {
      const response = await loginApi(data);
      const { accessToken, user } = response.data;

      login({ token: accessToken, user });

      toast.success('Welcome back! 🎉', {
        id: toastId,
        icon: '✅',
        style: {
          background: '#10b981',
          color: '#fff',
        },
      });

      const { defaultStartPage } = getPreferences();

      navigate(defaultStartPage || '/', {
        replace: true,
      });
    } catch (err) {
      const message =
        err.response?.data?.message || 'Invalid credentials.';

      toast.error(message, {
        id: toastId,
        icon: '❌',
        style: {
          background: '#ef4444',
          color: '#fff',
        },
      });

      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [login, navigate]);

  return (
    <AuthForm
      mode="login"
      title="Welcome Back"
      fields={LOGIN_FIELDS}
      form={form}
      onSubmit={handleLogin}
      isLoading={isLoading}
      submitText="Login"
      loadingText="Logging in..."
      error={null}
      extraContent={
        sessionExpired && (
          <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-100 p-3 text-center text-sm text-yellow-800">
            Your session expired. Please log in again.
          </div>
        )
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