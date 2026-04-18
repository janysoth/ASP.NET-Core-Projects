import React, { useCallback, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import AuthForm from '../../components/forms/AuthForm';
import { EmailIcon, EyeIcon, EyeOffIcon, LockIcon } from '../../components/icons/Icons';

import { useAuth } from '../../hooks/useAuth';
import { useForm } from '../../hooks/useForm';
import { login as loginApi } from '../../services/api';

import { getLoginFormState } from '../../utils/formStates';
import { validateEmail, validatePassword } from '../../utils/validation';

const FIELD_CONFIG = [
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'Enter your email',
    icon: <EmailIcon />,
    validate: validateEmail
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    icon: <LockIcon />,
    showIcon: <EyeIcon />,
    hideIcon: <EyeOffIcon />,
    validate: validatePassword
  }
];

const LoginPage = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('reason') === 'session_expired';

  const navigate = useNavigate();
  const { login } = useAuth();

  const form = useForm(FIELD_CONFIG, getLoginFormState);

  const handleLogin = useCallback(async (data) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await loginApi(data);
      const { accessToken, user } = response.data;

      login({ token: accessToken, user });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  }, [login, navigate]);

  return (
    <AuthForm
      title="Welcome Back"
      fields={FIELD_CONFIG}
      form={form}
      onSubmit={handleLogin}
      error={error}
      isLoading={isLoading}
      submitText="Login"
      loadingText="Logging in..."
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
            <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline">
              Forgot Password?
            </Link>
          </div>

          Don’t have an account?{' '}
          <Link to="/register" className="text-indigo-600 font-medium hover:underline">
            Register
          </Link>
        </>
      }
    />
  );
};

export default LoginPage;