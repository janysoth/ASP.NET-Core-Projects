import { useCallback, useMemo, useState } from 'react';

export const useForm = (fieldConfig, getInitialState) => {
  const [formData, setFormData] = useState(getInitialState);
  const [submitted, setSubmitted] = useState(false);

  // Validation (dynamic form config)
  const errors = useMemo(() => {
    const result = {};

    fieldConfig.forEach(field => {
      if (field.validate) {
        result[field.name] = field.validate(formData[field.name]);
      }
    });

    return result;
  }, [formData, fieldConfig]);

  const hasErrors = useMemo(
    () => Object.values(errors).some(Boolean),
    [errors]
  );

  const handleChange = useCallback(
    (field) => (value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    },
    []
  );

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
  };
};