import React, { useEffect, useMemo, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { checkEmailExists } from '../../services/api';
import PasswordStrength from '../common/PasswordStrength';

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

  const [asyncError, setAsyncError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const debouncedValue = useDebounce(value, 500);

  const handleChange = (e) => {
    if (!dirty) setDirty(true);
    setAsyncError('');
    onAsyncValidationChange?.('', '');
    onChange(e.target.value);
  };

  // =========================
  // Sync validation
  // =========================
  const syncError = useMemo(() => {
    if (!validate || !dirty) return '';
    return validate(debouncedValue);
  }, [validate, debouncedValue, dirty]);

  // =========================
  // Email async validation
  // =========================
  useEffect(() => {
    if (type !== 'email' || !emailMode || !dirty || syncError || !debouncedValue) return;

    let active = true;

    const run = async () => {
      try {
        setIsChecking(true);

        const res = await checkEmailExists(debouncedValue);
        const exists = res.data.emailExists;

        if (!active) return;

        const error =
          emailMode === 'register'
            ? exists ? 'Email already exists.' : ''
            : !exists ? 'Email does not exist.' : '';

        setAsyncError(error);
        onAsyncValidationChange?.(type, error);

      } catch {
        if (active) setAsyncError('Unable to validate email');
      } finally {
        if (active) setIsChecking(false);
      }
    };

    run();

    return () => { active = false; };

  }, [debouncedValue, syncError, dirty, emailMode, type, onAsyncValidationChange]);

  const errorMessage = syncError || asyncError;

  const borderClass = useMemo(() => {
    if (!dirty) return 'border-gray-300';
    if (errorMessage) return 'border-red-500';
    if (debouncedValue && !isChecking) return 'border-green-500';
    return 'border-gray-300';
  }, [dirty, errorMessage, debouncedValue, isChecking]);

  return (
    <div className="flex flex-col">
      <label className="mb-1 font-medium">{label}</label>

      <div className={`flex items-center border rounded px-3 py-2 ${borderClass}`}>
        {icon && <span className="mr-2">{icon}</span>}

        <input
          type={type === 'password' && visible ? 'text' : type}
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
          className="flex-1 outline-none"
        />

        {type === 'password' && (
          <span onClick={() => setVisible(v => !v)} className="ml-2 cursor-pointer">
            {visible ? hideIcon : showIcon}
          </span>
        )}
      </div>

      {/* Password Strength ONLY on Register */}
      {type === 'password' && emailMode === 'register' && (
        <PasswordStrength password={debouncedValue} />
      )}

      {isChecking && (
        <p className="text-gray-500 text-sm mt-1">Checking email...</p>
      )}

      {errorMessage && !isChecking && (
        <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
      )}
    </div>
  );
};

export default InputField;