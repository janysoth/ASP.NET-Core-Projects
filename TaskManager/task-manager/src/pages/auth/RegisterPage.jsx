import React, { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

import AuthForm from '../../components/forms/AuthForm';
import { EmailIcon, EyeIcon, EyeOffIcon, LockIcon, UserIcon } from '../../components/icons/Icons';

import { useForm } from '../../hooks/useForm';
import { register as registerApi } from '../../services/api';

import { getRegisterFormState } from '../../utils/formStates';
import { validateEmail, validateFullName, validatePassword } from '../../utils/validation';

// =========================
// Field Config
// =========================
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
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const form = useForm(FIELD_CONFIG, getRegisterFormState);

  // =========================
  // Submit Handler
  // =========================
  const handleRegister = useCallback(async (data) => {
    setIsLoading(true);

    // 🔄 Loading toast
    const toastId = toast.loading('Creating account...', {
      style: {
        background: '#334155',
        color: '#fff',
      },
    });

    try {
      await registerApi(data);

      // ✅ Success toast
      toast.success('Account created successfully! 🎉', {
        id: toastId,
        icon: '✅',
        style: {
          background: '#10b981',
          color: '#fff',
        },
      });

      navigate('/login', { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message || 'Registration failed.';

      // ❌ Error toast
      toast.error(message, {
        id: toastId,
        icon: '❌',
        style: {
          background: '#ef4444',
          color: '#fff',
        },
      });

      console.error('Registration error:', err);
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
      isLoading={isLoading}
      submitText="Register"
      loadingText="Creating account..."

      // ❌ Remove inline error
      error={null}

      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-indigo-600 font-medium hover:underline"
          >
            Login
          </Link>
        </>
      }
    />
  );
};

export default RegisterPage;