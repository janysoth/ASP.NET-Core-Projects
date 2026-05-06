import React, { useCallback, useState } from 'react';
import FormButton from '../common/FormButton';
import PasswordStrength from '../common/PasswordStrength';
import InputField from '../input/InputField'; // ✅ ADD THIS

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
  extraContent
}) => {
  const {
    formData,
    hasErrors,
    setSubmitted,
    handleChange,
  } = form;

  const [asyncErrors, setAsyncErrors] = useState({});

  const handleAsyncValidation = useCallback((fieldName, error) => {
    setAsyncErrors(prev => {
      if (!error) {
        const updated = { ...prev };
        delete updated[fieldName];
        return updated;
      }

      return {
        ...prev,
        [fieldName]: error
      };
    });
  }, []);

  const hasServerErrors = Object.keys(asyncErrors).length > 0;

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setSubmitted(true);

    if (hasErrors || hasServerErrors) return;

    onSubmit(formData);
  }, [hasErrors, hasServerErrors, onSubmit, setSubmitted, formData]);

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

        {/* INPUT */}
        <InputField
          {...field}
          value={formData[field.name]}
          onChange={handleChangeWithReset}
          emailMode={title === 'Welcome Back' ? 'login' : 'register'}
          onAsyncValidationChange={handleAsync}
        />

        {/* ✅ PASSWORD STRENGTH ONLY FOR PASSWORD FIELD IN REGISTER PAGE */}
        {mode === 'register' && field.type === 'password' && (
          <PasswordStrength password={formData[field.name]} />
        )}

      </div>
    );
  }, [formData, handleChange, handleAsyncValidation, title, mode]);

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