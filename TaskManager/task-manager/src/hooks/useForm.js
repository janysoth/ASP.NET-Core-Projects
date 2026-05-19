import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const DEBOUNCE_DELAY = 500;

export const useForm = (fieldConfig, getInitialState) => {
  const [formData, setFormData] = useState(getInitialState);
  const [submitted, setSubmitted] = useState(false);

  const [asyncErrors, setAsyncErrors] = useState({});
  const [asyncLoading, setAsyncLoading] = useState({});

  const requestIdRef = useRef({});

  // =========================
  // SYNC VALIDATION
  // =========================
  const errors = useMemo(() => {
    const result = {};

    fieldConfig.forEach((field) => {
      if (!field.validate) return;

      result[field.name] = field.validate(
        formData[field.name],
        formData
      );
    });

    return result;
  }, [formData, fieldConfig]);

  const hasErrors = useMemo(() => {
    return (
      Object.values(errors).some(Boolean) ||
      Object.values(asyncErrors).some(Boolean)
    );
  }, [errors, asyncErrors]);

  // =========================
  // HANDLE CHANGE
  // =========================
  const handleChange = useCallback(
    (fieldName) => (value) => {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: value,
      }));
    },
    []
  );

  // =========================
  // ASYNC VALIDATION
  // =========================
  useEffect(() => {
    const timers = [];

    fieldConfig.forEach((field) => {
      if (!field.asyncValidate) return;

      const value = formData[field.name];

      if (!value) return;

      const requestId = Date.now();
      requestIdRef.current[field.name] = requestId;

      setAsyncLoading((prev) => ({
        ...prev,
        [field.name]: true,
      }));

      const timer = setTimeout(async () => {
        try {
          const error = await field.asyncValidate(value, formData);

          if (requestIdRef.current[field.name] !== requestId) return;

          setAsyncErrors((prev) => ({
            ...prev,
            [field.name]: error || '',
          }));
        } catch {
          setAsyncErrors((prev) => ({
            ...prev,
            [field.name]: 'Validation failed',
          }));
        } finally {
          setAsyncLoading((prev) => ({
            ...prev,
            [field.name]: false,
          }));
        }
      }, DEBOUNCE_DELAY);

      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, [formData, fieldConfig]);

  // =========================
  // RESET
  // =========================
  const resetForm = useCallback(() => {
    setFormData(getInitialState());
    setSubmitted(false);
    setAsyncErrors({});
    setAsyncLoading({});
  }, [getInitialState]);

  // =========================
  // NORMALIZE
  // =========================
  const getNormalizedData = useCallback(() => {
    const normalized = {};

    Object.keys(formData).forEach((key) => {
      const value = formData[key];

      normalized[key] =
        typeof value === 'string' ? value.trim() : value;
    });

    return normalized;
  }, [formData]);

  return {
    formData,
    errors,
    asyncErrors,
    asyncLoading,
    hasErrors,
    submitted,
    setSubmitted,
    handleChange,
    resetForm,
    getNormalizedData,
  };
};