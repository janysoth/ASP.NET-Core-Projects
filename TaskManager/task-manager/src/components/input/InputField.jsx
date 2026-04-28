import React, { useEffect, useMemo, useState } from 'react';

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
}) => {
  const [visible, setVisible] = useState(false);

  const [dirty, setDirty] = useState(false);        // user has typed
  const [debouncedValue, setDebouncedValue] = useState(value);

  // =========================
  // Debounce input
  // =========================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [value]);

  // =========================
  // Mark field as touched
  // =========================
  const handleChange = (e) => {
    if (!dirty) setDirty(true);
    onChange(e.target.value);
  };

  const toggleVisibility = () => setVisible(!visible);

  // =========================
  // Validation (AFTER pause)
  // =========================
  const errorMessage = useMemo(() => {
    if (!validate || !dirty) return '';
    return validate(debouncedValue);
  }, [validate, debouncedValue, dirty]);

  // =========================
  // Border logic
  // =========================
  const borderClass = useMemo(() => {
    if (!dirty) return 'border-gray-300';

    if (errorMessage) return 'border-red-500';

    if (debouncedValue) return 'border-green-500';

    return 'border-gray-300';
  }, [dirty, errorMessage, debouncedValue]);

  return (
    <div className="flex flex-col">
      <label className="mb-1 font-medium">{label}</label>

      <div
        className={`
          flex items-center border rounded px-3 py-2 transition
          focus-within:border-blue-500
          ${borderClass}
        `}
      >
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

      {errorMessage && (
        <p className="text-red-600 text-sm mt-1">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default InputField;