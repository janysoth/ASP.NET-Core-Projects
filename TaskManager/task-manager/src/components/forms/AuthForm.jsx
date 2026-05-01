import React, { useCallback, useState } from 'react';
import FormButton from '../common/FormButton';
import InputField from '../input/InputField';

const AuthForm = ({
  title,
  fields,
  form,
  onSubmit,
  error,
  isLoading,
  submitText,
  loadingText,
  footer,
  extraContent
}) => {
  const {
    formData,
    errors,
    hasErrors,
    submitted,
    setSubmitted,
    handleChange,
  } = form;

  const [asyncErrors, setAsyncErrors] = useState({});

  const handleAsyncValidation = (fieldName, error) => {
    setAsyncErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setSubmitted(true);

    if (hasErrors) return;

    onSubmit(formData); // ✅ no normalization layer
  }, [hasErrors, onSubmit, setSubmitted, formData]);

  const renderField = useCallback((field) => (
    <InputField
      key={field.name}
      {...field}
      value={formData[field.name]}
      onChange={handleChange(field.name)}
      emailMode={title === 'Welcome Back' ? 'login' : 'register'}
      onAsyncValidationChange={(value, error) =>
        handleAsyncValidation(field.name, error)
      }
    />
  ), [formData, handleChange, errors, submitted, title]);

  const disableSubmit =
    hasErrors || form.asyncErrors?.email;

  const hasServerErrors = Object.values(asyncErrors).some(Boolean);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">

        {extraContent}

        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          {title}
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 mb-4 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
          <div className="mt-6 text-center text-gray-600">
            {footer}
          </div>
        )}

      </div>
    </div>
  );
};

export default AuthForm;