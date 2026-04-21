import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import AuthForm from '../../components/forms/AuthForm';
import { EmailIcon, EyeIcon, EyeOffIcon, LockIcon, UserIcon } from '../../components/icons/Icons';

import { useForm } from '../../hooks/useForm';
import { register as registerApi } from '../../services/api';

import { getRegisterFormState } from '../../utils/formStates';
import { validateEmail, validateFullName, validatePassword } from '../../utils/validation';

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
  const form = useForm(FIELD_CONFIG, getRegisterFormState);

  const handleRegister = useCallback(async (data) => {
    setError('');
    setIsLoading(true);

    try {
      await registerApi(data);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  return (
    <AuthForm
      title="Create Account"
      fields={FIELD_CONFIG}
      form={form}
      onSubmit={handleRegister}
      error={error}
      isLoading={isLoading}
      submitText="Register"
      loadingText="Creating account..."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">
            Login
          </Link>
        </>
      }
    />
  );
};

export default RegisterPage;