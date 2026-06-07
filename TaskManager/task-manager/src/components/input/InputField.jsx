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
  value = '',
  onChange,
  onAsyncValidationChange,
  emailMode,
  formData = {},
}) => {
  const [visible, setVisible] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [value]);

  const handleChange = (e) => {
    if (!dirty) setDirty(true);

    onAsyncValidationChange?.('');
    onChange(e.target.value);
  };

  const toggleVisibility = () => setVisible((v) => !v);

  const syncError = useMemo(() => {
    if (!validate || !dirty) return '';
    return validate(debouncedValue, formData);
  }, [validate, debouncedValue, dirty, formData]);

  const { error: asyncError, isChecking } = useEmailValidation({
    value: debouncedValue,
    enabled: type === 'email' && !!emailMode && dirty,
    mode: emailMode,
    syncError,
    onResult: (error) => onAsyncValidationChange?.(error),
  });

  const errorMessage = syncError || asyncError;

  const borderClass = useMemo(() => {
    if (!dirty) return 'border-[var(--app-border)]';
    if (errorMessage) return 'border-red-500';
    if (debouncedValue && !isChecking) return 'border-green-500';
    return 'border-[var(--app-border)]';
  }, [dirty, errorMessage, debouncedValue, isChecking]);

  return (
    <div className="flex flex-col">
      <label className="mb-1 font-medium text-[var(--app-text)]">
        {label}
      </label>

      <div
        className={`
          flex items-center rounded border px-3 py-2 transition
          bg-[var(--app-surface)]
          text-[var(--app-text)]
          ${borderClass}
        `}
      >
        {icon && (
          <span className="mr-2 text-[var(--app-text-muted)]">
            {icon}
          </span>
        )}

        <input
          type={visible ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          className="
            flex-1 bg-transparent outline-none
            text-[var(--app-text)]
            placeholder:text-[var(--app-text-muted)]
          "
        />

        {type === 'password' && (showIcon || hideIcon) && (
          <span
            onClick={toggleVisibility}
            className="ml-2 cursor-pointer text-[var(--app-text-muted)] hover:text-[var(--app-text)]"
          >
            {visible ? hideIcon : showIcon}
          </span>
        )}
      </div>

      {isChecking && (
        <p className="mt-1 text-sm text-[var(--app-text-muted)]">
          Checking email...
        </p>
      )}

      {!isChecking && errorMessage && (
        <p className="mt-1 text-sm text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default InputField;