import React, { useEffect, useMemo, useState } from 'react';
import { useEmailValidation } from '../../hooks/useEmailValidation';

const DEBOUNCE_DELAY = 500;

const InputField = ({
  label,
  type = 'text',
  placeholder,
  icon,
  showIcon,
  hideIcon,
  validate,
  value,
  onChange,
  onAsyncValidationChange,
  emailMode,
}) => {
  const [visible, setVisible] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(value);

  // =========================
  // Debounce
  // =========================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [value]);

  const handleChange = (e) => {
    if (!dirty) setDirty(true);

    // ✅ Clear async error immediately
    onAsyncValidationChange?.('');

    onChange(e.target.value);
  };

  const toggleVisibility = () => setVisible(!visible);

  // =========================
  // Sync validation
  // =========================
  const syncError = useMemo(() => {
    if (!validate || !dirty) return '';
    return validate(debouncedValue);
  }, [validate, debouncedValue, dirty]);

  // =========================
  // Async Email Validation
  // =========================
  const { error: asyncError, isChecking } = useEmailValidation({
    value: debouncedValue,
    enabled: type === 'email' && !!emailMode && dirty,
    mode: emailMode,
    syncError,
    onResult: (error) => onAsyncValidationChange?.(error),
  });

  // =========================
  // Final error
  // =========================
  const errorMessage = syncError || asyncError;

  // =========================
  // Border color
  // =========================
  const borderClass = useMemo(() => {
    if (!dirty) return 'border-gray-300';
    if (errorMessage) return 'border-red-500';
    if (debouncedValue && !isChecking) return 'border-green-500';
    return 'border-gray-300';
  }, [dirty, errorMessage, debouncedValue, isChecking]);

  return (
    <div className="flex flex-col">
      <label className="mb-1 font-medium">{label}</label>

      <div className={`flex items-center border rounded px-3 py-2 transition ${borderClass}`}>
        {icon && <span className="mr-2">{icon}</span>}

        <input
          type={visible ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          className="flex-1 outline-none"
        />

        {type === 'password' && (showIcon || hideIcon) && (
          <span onClick={toggleVisibility} className="ml-2 cursor-pointer">
            {visible ? hideIcon : showIcon}
          </span>
        )}
      </div>

      {/* Checking */}
      {isChecking && (
        <p className="text-gray-500 text-sm mt-1">Checking email...</p>
      )}

      {/* Error */}
      {!isChecking && errorMessage && (
        <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
      )}
    </div>
  );
};

export default InputField;