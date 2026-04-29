import React, { useEffect, useMemo, useState } from 'react';
import { checkEmailExists } from '../../services/api';
import { getPasswordStrength } from '../../utils/validation';

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
  checkEmailExists: shouldCheckEmail,
}) => {
  const [visible, setVisible] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [debouncedValue, setDebouncedValue] = useState(value);

  const [asyncError, setAsyncError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  // =========================
  // Debounce
  // =========================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [value]);

  // =========================
  // Handle input
  // =========================
  const handleChange = (e) => {
    if (!dirty) setDirty(true);
    setAsyncError('');
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
  // Async email validation
  // =========================
  useEffect(() => {
    if (!shouldCheckEmail) return;
    if (!dirty) return;
    if (!debouncedValue) return;
    if (syncError) return;

    let isActive = true;

    const run = async () => {
      try {
        setIsChecking(true);

        const res = await checkEmailExists(debouncedValue);

        if (!isActive) return;

        if (res.data.emailExists) {
          setAsyncError('Email already exists');
        } else {
          setAsyncError('');
        }
      } catch {
        if (isActive) {
          setAsyncError('Unable to validate email');
        }
      } finally {
        if (isActive) {
          setIsChecking(false);
        }
      }
    };

    run();

    return () => {
      isActive = false;
    };
  }, [debouncedValue, syncError, dirty, shouldCheckEmail]);

  // =========================
  // Password strength (USING YOUR FUNCTION)
  // =========================
  const passwordStrength = useMemo(() => {
    if (type !== 'password' || !dirty) return null;
    return getPasswordStrength(debouncedValue);
  }, [debouncedValue, dirty, type]);

  // =========================
  // Final error
  // =========================
  const errorMessage = syncError || asyncError;

  // =========================
  // Border logic
  // =========================
  const borderClass = useMemo(() => {
    if (!dirty) return 'border-gray-300';

    if (errorMessage) return 'border-red-500';

    if (debouncedValue && !isChecking) return 'border-green-500';

    return 'border-gray-300';
  }, [dirty, errorMessage, debouncedValue, isChecking]);

  // =========================
  // Strength bar width
  // =========================
  const strengthWidth = passwordStrength
    ? `${(passwordStrength.score / 5) * 100}%`
    : '0%';

  const strengthColor = useMemo(() => {
    if (!passwordStrength) return '';

    if (passwordStrength.score <= 1) return 'bg-red-500';
    if (passwordStrength.score === 2) return 'bg-orange-500';
    if (passwordStrength.score === 3) return 'bg-yellow-500';
    if (passwordStrength.score === 4) return 'bg-blue-500';
    return 'bg-green-500';
  }, [passwordStrength]);

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

      {/* =========================
          Password Strength Meter
      ========================= */}
      {type === 'password' && dirty && debouncedValue && passwordStrength && (
        <div className="mt-2">
          <div className="h-2 w-full bg-gray-200 rounded">
            <div
              className={`h-2 rounded transition-all duration-300 ${strengthColor}`}
              style={{ width: strengthWidth }}
            />
          </div>

          <p className="text-xs mt-1 text-gray-600">
            Strength: {passwordStrength.label}
          </p>
        </div>
      )}

      {/* ⏳ Checking */}
      {isChecking && (
        <p className="text-gray-500 text-sm mt-1">
          Checking email...
        </p>
      )}

      {/* ❌ Error */}
      {!isChecking && errorMessage && (
        <p className="text-red-600 text-sm mt-1">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default InputField;