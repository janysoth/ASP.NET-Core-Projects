import React, { useCallback, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { EmailIcon, EyeIcon, EyeOffIcon, LockIcon } from '../../components/icons/Icons';
import InputField from '../../components/input/InputField';

import { useAuth } from '../../hooks/useAuth';
import { useForm } from '../../hooks/useForm';
import { login as loginApi } from '../../services/api';

import { getLoginFormState } from '../../utils/formStates';
import { validateEmail, validatePassword } from '../../utils/validation';

// Config
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

  const {
    formData,
    errors,
    hasErrors,
    submitted,
    setSubmitted,
    handleChange,
  } = useForm(FIELD_CONFIG, getLoginFormState);

  const isSubmitDisabled = hasErrors || isLoading;

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    setSubmitted(true);
    setError('');

    if (hasErrors) return;

    setIsLoading(true);

    try {
      const response = await loginApi({
        email: formData.email.trim(),
        password: formData.password.trim(),
      });

      const { accessToken, user } = response.data;

      login({ token: accessToken, user });
      navigate('/', { replace: true });
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        'Invalid credentials. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [formData, hasErrors, login, navigate, setSubmitted]);

  const renderField = useCallback((field) => (
    <InputField
      key={field.name}
      {...field}
      value={formData[field.name]}
      onChange={handleChange(field.name)}
      error={errors[field.name]}
      showError={submitted}
    />
  ), [formData, handleChange, errors, submitted]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">

        {sessionExpired && (
          <div className="mb-4 bg-yellow-100 text-yellow-800 p-3 rounded-lg text-sm text-center">
            Your session expired. Please log in again.
          </div>
        )}

        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Welcome Back
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 mb-4 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {FIELD_CONFIG.map(renderField)}

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`w-full py-3 font-semibold rounded-md transition-all ${isSubmitDisabled
                ? 'bg-gray-400'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Don’t have an account?{' '}
          <Link to="/register" className="text-indigo-600 font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;