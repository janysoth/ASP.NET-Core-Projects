import { useCallback, useMemo, useState } from 'react';

// =========================
// Validation Engine
// =========================
const runValidation = (field, value) => {
  const val = value ?? '';

  // Required
  if (field.required && !val.toString().trim()) {
    return `${field.label || field.name} is required`;
  }

  // Min length
  if (field.minLength && val.length < field.minLength) {
    return `${field.label || field.name} must be at least ${field.minLength} characters`;
  }

  // Pattern (regex)
  if (field.pattern && !field.pattern.test(val)) {
    return `${field.label || field.name} is invalid`;
  }

  // Custom validator
  if (field.validate) {
    return field.validate(val);
  }

  return '';
};

export const useForm = (fieldConfig, getInitialState) => {
  const [formData, setFormData] = useState(getInitialState);
  const [submitted, setSubmitted] = useState(false);

  // =========================
  // Validation
  // =========================
  const errors = useMemo(() => {
    const result = {};

    fieldConfig.forEach((field) => {
      const value = formData[field.name];
      result[field.name] = runValidation(field, value);
    });

    return result;
  }, [formData, fieldConfig]);

  const hasErrors = useMemo(
    () => Object.values(errors).some(Boolean),
    [errors]
  );

  // =========================
  // ✅ FIXED: Change handler (NO normalize here)
  // =========================
  const handleChange = useCallback(
    (fieldName) => (value) => {
      setFormData(prev => ({
        ...prev,
        [fieldName]: value, // ✅ raw value only
      }));
    },
    []
  );

  // =========================
  // ✅ NEW: Normalize on demand
  // =========================
  const getNormalizedData = useCallback(() => {
    return fieldConfig.reduce((acc, field) => {
      const value = formData[field.name];

      acc[field.name] = field.normalize
        ? field.normalize(value)
        : value;

      return acc;
    }, {});
  }, [formData, fieldConfig]);

  // =========================
  // Reset
  // =========================
  const resetForm = useCallback(() => {
    setFormData(getInitialState());
    setSubmitted(false);
  }, [getInitialState]);

  return {
    formData,
    setFormData,
    errors,
    hasErrors,
    submitted,
    setSubmitted,
    handleChange,
    resetForm,
    getNormalizedData, // ✅ expose this
  };
};