import React, { useCallback, useState } from 'react';

import FormButton from '../common/FormButton';
import PasswordStrength from '../common/PasswordStrength';
import InputField from '../inputs/InputField';

const AuthForm = ({
  title,
  mode,
  fields,
  form,
  onSubmit,
  error,
  isLoading,
  submitText,
  loadingText,
  footer,
  extraContent,
}) => {
  const {
    formData,
    hasErrors,
    setSubmitted,
    handleChange,
  } = form;

  const [asyncErrors, setAsyncErrors] = useState({});

  const handleAsyncValidation = useCallback((fieldName, error) => {
    setAsyncErrors((prev) => {
      if (!error) {
        const updated = { ...prev };
        delete updated[fieldName];
        return updated;
      }

      return {
        ...prev,
        [fieldName]: error,
      };
    });
  }, []);

  const hasServerErrors =
    Object.keys(asyncErrors).length > 0;

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setSubmitted(true);

    if (hasErrors || hasServerErrors) return;

    onSubmit(formData);
  }, [
    hasErrors,
    hasServerErrors,
    onSubmit,
    setSubmitted,
    formData,
  ]);

  const renderField = useCallback((field) => {
    const handleAsync = (error) => {
      handleAsyncValidation(field.name, error);
    };

    const handleChangeWithReset = (value) => {
      handleAsyncValidation(field.name, '');
      handleChange(field.name)(value);
    };

    return (
      <div key={field.name}>
        <InputField
          {...field}
          value={formData[field.name]}
          formData={formData}
          onChange={handleChangeWithReset}
          emailMode={
            title === 'Welcome Back'
              ? 'login'
              : 'register'
          }
          onAsyncValidationChange={handleAsync}
        />

        {mode === 'register' &&
          field.name === 'password' && (
            <PasswordStrength
              password={formData[field.name]}
            />
          )}
      </div>
    );
  }, [
    formData,
    handleChange,
    handleAsyncValidation,
    title,
    mode,
  ]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-8 shadow-lg">
        {extraContent}

        <h2 className="mb-6 text-center text-3xl font-bold text-[var(--app-primary)]">
          {title}
        </h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
        >
          {fields.map(renderField)}

          <FormButton
            isLoading={isLoading}
            disabled={hasErrors || hasServerErrors}
            loadingText={loadingText}
          >
            {submitText}
          </FormButton>
        </form>

        {footer && (
          <div className="mt-6 text-center text-[var(--app-text-muted)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthForm;