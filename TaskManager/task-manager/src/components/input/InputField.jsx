import React, { useEffect, useMemo, useState } from 'react';
import { checkEmailExists } from '../../services/api';
import { getPasswordStrength } from '../../utils/validation';

const DEBOUNCE_DELAY = 300;

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

  const handleChange = (e) => {
    if (!dirty) setDirty(true);

    setAsyncError('');
    onAsyncValidationChange?.('', ''); // reset global error

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
    if (type !== 'email') return;
    if (!emailMode) return;
    if (!dirty) return;
    if (!debouncedValue) return;
    if (syncError) return;

    let active = true;

    const run = async () => {
      try {
        setIsChecking(true);

        const res = await checkEmailExists(debouncedValue);
        const exists = res.data.emailExists;

        if (!active) return;

        let error = '';

        if (emailMode === 'register') {
          error = exists ? 'Email already exists.' : '';
        }

        if (emailMode === 'login') {
          error = !exists ? 'Email does not exist.' : '';
        }

        setAsyncError(error);
        onAsyncValidationChange?.(type, error); // notify parent

      } catch {
        if (active) {
          setAsyncError('Unable to validate email');
          onAsyncValidationChange?.(type, 'Unable to validate email');
        }
      } finally {
        if (active) setIsChecking(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [
    debouncedValue,
    syncError,
    dirty,
    emailMode,
    type,
    onAsyncValidationChange, // ✅ FIXED
    value // ✅ FIXED (eslint requirement)
  ]);

  // =========================
  // Password strength
  // =========================
  const passwordStrength = useMemo(() => {
    if (type !== 'password' || emailMode !== 'register' || !dirty)
      return null;

    return getPasswordStrength(debouncedValue);
  }, [debouncedValue, dirty, type, emailMode]);

  const errorMessage = syncError || asyncError;

  const borderClass = useMemo(() => {
    if (!dirty) return 'border-gray-300';
    if (errorMessage) return 'border-red-500';
    if (debouncedValue && !isChecking) return 'border-green-500';
    return 'border-gray-300';
  }, [dirty, errorMessage, debouncedValue, isChecking]);

  const strengthWidth = passwordStrength
    ? `${(passwordStrength.score / 5) * 100}%`
    : '0%';

  const strengthColor =
    passwordStrength?.score <= 1 ? 'bg-red-500' :
      passwordStrength?.score === 2 ? 'bg-orange-500' :
        passwordStrength?.score === 3 ? 'bg-yellow-500' :
          passwordStrength?.score === 4 ? 'bg-blue-500' :
            'bg-green-500';

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

      {type === 'password' && emailMode === 'register' && dirty && passwordStrength && (
        <div className="mt-2">
          <div className="h-2 w-full bg-gray-200 rounded">
            <div
              className={`h-2 rounded transition-all ${strengthColor}`}
              style={{ width: strengthWidth }}
            />
          </div>
          <p className="text-xs mt-1 text-gray-600">
            Strength: {passwordStrength.label}
          </p>
        </div>
      )}

      {isChecking && (
        <p className="text-gray-500 text-sm mt-1">Checking email...</p>
      )}

      {!isChecking && errorMessage && (
        <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
      )}
    </div>
  );
};

export default InputField;