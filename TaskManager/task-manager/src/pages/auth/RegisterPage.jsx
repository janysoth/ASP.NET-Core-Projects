import React, { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

import AuthForm from '../../components/forms/AuthForm';

import { useForm } from '../../hooks/useForm';
import { register as registerApi } from '../../services/api';

import { REGISTER_FIELDS } from '../../features/auth/authFields';
import { getApiError } from '../../utils/apiError';
import { getRegisterFormState } from '../../utils/formStates';

const RegisterPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const form = useForm(REGISTER_FIELDS, getRegisterFormState);

  const handleRegister = useCallback(async (data) => {
    setIsLoading(true);

    const toastId = toast.loading('Creating account...', {
      style: {
        background: '#334155',
        color: '#fff',
      },
    });

    try {
      await registerApi(data);

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
      const { message } = getApiError(err);

      // 👉 Email exists → redirect to login
      if (message.toLowerCase().includes('email already')) {
        toast.error('Email already exists. Redirecting to login...', {
          id: toastId,
          icon: '⚠️',
          style: {
            background: '#f59e0b',
            color: '#fff',
          },
        });

        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1500);

        return;
      }

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
      fields={REGISTER_FIELDS}
      form={form}
      onSubmit={handleRegister}
      isLoading={isLoading}
      submitText="Register"
      loadingText="Creating account..."
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