import React, { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import AuthForm from '../../components/forms/AuthForm';

import { useAuth } from '../../hooks/useAuth';
import { useForm } from '../../hooks/useForm';
import { login as loginApi } from '../../services/api';

import { LOGIN_FIELDS } from '../../features/auth/authFields';
import { getLoginFormState } from '../../utils/formStates';


const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('reason') === 'session_expired';

  const navigate = useNavigate();
  const { login } = useAuth();

  const form = useForm(LOGIN_FIELDS, getLoginFormState);

  // =========================
  // Submit Handler
  // =========================
  const handleLogin = useCallback(async (data) => {
    setIsLoading(true);

    // 🔄 Loading toast
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

      // ✅ Success toast
      toast.success('Welcome back! 🎉', {
        id: toastId,
        icon: '✅',
        style: {
          background: '#10b981',
          color: '#fff',
        },
      });

      navigate('/', { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message || 'Invalid credentials.';

      // ❌ Error toast
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

      // ✅ Removed inline error completely
      error={null}

      // ✅ Keep contextual message inline (correct UX)
      extraContent={
        sessionExpired && (
          <div className="mb-4 bg-yellow-100 text-yellow-800 p-3 rounded-lg text-sm text-center">
            Your session expired. Please log in again.
          </div>
        )
      }

      footer={
        <>
          <div className="flex justify-end mb-2">
            <Link
              to="/forgot-password"
              className="text-sm text-indigo-600 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          Don’t have an account?{' '}
          <Link
            to="/register"
            className="text-indigo-600 font-medium hover:underline"
          >
            Register
          </Link>
        </>
      }
    />
  );
};

export default LoginPage;