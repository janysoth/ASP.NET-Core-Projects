import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';

import toast from 'react-hot-toast';
import {
  Link,
  useNavigate,
} from 'react-router-dom';

import AuthForm from '../../components/form/AuthForm';
import ImageUploadField from '../../components/input/ImageUploadField';

import { useForm } from '../../hooks/useForm';

import { register as registerApi } from '../../services/api';

import { REGISTER_FIELDS } from '../../utils/auth/authFields';

import { getApiError } from '../../utils/apiError';
import { getRegisterFormState } from '../../utils/formStates';

const RegisterPage = () => {
  const [isLoading, setIsLoading] =
    useState(false);

  const navigate = useNavigate();

  const form = useForm(
    REGISTER_FIELDS,
    getRegisterFormState
  );

  const {
    formData,
    handleChange,
  } = form;

  // -------------------------
  // Image preview
  // -------------------------
  const imagePreview = useMemo(() => {
    if (!formData.profileImage) return '';

    return URL.createObjectURL(
      formData.profileImage
    );
  }, [formData.profileImage]);

  // -------------------------
  // Register
  // -------------------------
  const handleRegister = useCallback(
    async () => {
      setIsLoading(true);

      const toastId = toast.loading(
        'Creating account...',
        {
          style: {
            background: '#334155',
            color: '#fff',
          },
        }
      );

      try {
        const payload = new FormData();

        payload.append(
          'fullName',
          formData.fullName
        );

        payload.append(
          'email',
          formData.email
        );

        payload.append(
          'password',
          formData.password
        );

        if (formData.profileImage) {
          payload.append(
            'profileImage',
            formData.profileImage
          );
        }

        await registerApi(payload);

        toast.success(
          'Account created successfully! 🎉',
          {
            id: toastId,
            icon: '✅',
            style: {
              background: '#10b981',
              color: '#fff',
            },
          }
        );

        navigate('/login', {
          replace: true,
        });

      } catch (err) {
        const { message } =
          getApiError(err);

        if (
          message
            .toLowerCase()
            .includes('email already')
        ) {
          toast.error(
            'Email already exists. Redirecting to login...',
            {
              id: toastId,
              icon: '⚠️',
              style: {
                background: '#f59e0b',
                color: '#fff',
              },
            }
          );

          setTimeout(() => {
            navigate('/login', {
              replace: true,
            });
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

      } finally {
        setIsLoading(false);
      }
    },
    [formData, navigate]
  );

  return (
    <AuthForm
      mode="register"
      title="Create Account"
      fields={REGISTER_FIELDS}
      form={form}
      onSubmit={handleRegister}
      isLoading={isLoading}
      submitText="Register"
      loadingText="Creating account..."
      error={null}

      extraContent={
        <ImageUploadField
          file={formData.profileImage}
          preview={imagePreview}
          fullName={formData.fullName}
          onChange={handleChange(
            'profileImage'
          )}
        />
      }

      footer={
        <>
          <span className="text-[var(--app-text-muted)]">
            Already have an account?{' '}
          </span>

          <Link
            to="/login"
            className="font-medium text-[var(--app-primary)] hover:underline"
          >
            Login
          </Link>
        </>
      }
    />
  );
};

export default RegisterPage;