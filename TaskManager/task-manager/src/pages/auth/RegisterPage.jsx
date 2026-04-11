import React, { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { EmailIcon, EyeIcon, EyeOffIcon, LockIcon, UserIcon } from '../../components/icons/Icons';
import InputField from '../../components/input/InputField';

import { register as registerApi } from '../../services/api';
import { validateEmail, validateFullName, validatePassword } from '../../utils/validation';

// Constants
const INITIAL_FORM_STATE = {
  fullName: '',
  email: '',
  password: ''
};

const FIELD_CONFIG = [
  {
    name: 'fullName',
    label: 'Full Name',
    type: 'text',
    placeholder: 'Enter your full name',
    icon: <UserIcon />,
    validate: validateFullName
  },
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
    placeholder: 'Create a password',
    icon: <LockIcon />,
    showIcon: <EyeIcon />,
    hideIcon: <EyeOffIcon />,
    validate: validatePassword
  }
];

const RegisterPage = () => {
  // State
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // Derived state
  const validationErrors = useMemo(() => ({
    fullName: validateFullName(formData.fullName),
    email: validateEmail(formData.email),
    password: validatePassword(formData.password)
  }), [formData]);

  const hasValidationErrors = useMemo(() =>
    Object.values(validationErrors).some(error => error !== ''),
    [validationErrors]
  );

  const isSubmitDisabled = hasValidationErrors || isLoading;

  // Handlers
  const handleChange = useCallback((field) => (value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError('');
  }, [error]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    setSubmitted(true);
    setError('');

    if (hasValidationErrors) return;

    setIsLoading(true);

    try {
      await registerApi(formData);
      navigate('/login', { replace: true });
    } catch (err) {
      const errorMessage = err.response?.data?.message
        || 'Registration failed. Please try again.';
      setError(errorMessage);
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [formData, hasValidationErrors, navigate]);

  // Render helpers
  const renderField = useCallback(({ name, validate, ...fieldProps }) => (
    <InputField
      key={name}
      {...fieldProps}
      value={formData[name]}
      onChange={handleChange(name)}
      showError={submitted}
    />
  ), [formData, handleChange, submitted]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Create Account
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 mb-4 rounded-lg text-sm text-center animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {FIELD_CONFIG.map(renderField)}

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`w-full py-3 font-semibold rounded-md transition-all duration-200 ${isSubmitDisabled
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md text-white active:scale-[0.98]'
              }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating account...
              </span>
            ) : (
              'Register'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-indigo-600 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;