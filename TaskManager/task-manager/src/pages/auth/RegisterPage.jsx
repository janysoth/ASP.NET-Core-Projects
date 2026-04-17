import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { EmailIcon, EyeIcon, EyeOffIcon, LockIcon, UserIcon } from '../../components/icons/Icons';
import InputField from '../../components/input/InputField';

import { useForm } from '../../hooks/useForm';
import { register as registerApi } from '../../services/api';

import { getRegisterFormState } from '../../utils/formStates';
import { validateEmail, validateFullName, validatePassword } from '../../utils/validation';

// Config
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
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const {
    formData,
    errors,
    hasErrors,
    submitted,
    setSubmitted,
    handleChange,
  } = useForm(FIELD_CONFIG, getRegisterFormState);

  const isSubmitDisabled = hasErrors || isLoading;

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    setSubmitted(true);
    setError('');

    if (hasErrors) return;

    setIsLoading(true);

    try {
      await registerApi(formData);
      navigate('/login', { replace: true });
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [formData, hasErrors, navigate, setSubmitted]);

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

        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Create Account
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 mb-4 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {FIELD_CONFIG.map(renderField)}

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`w-full py-3 font-semibold rounded-md transition-all ${isSubmitDisabled
                ? 'bg-gray-400'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
          >
            {isLoading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;