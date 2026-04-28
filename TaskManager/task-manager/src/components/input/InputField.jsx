import React, { useEffect, useRef, useState } from 'react';

const getPasswordStrength = (password = '') => {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return score;
};

const strengthMeta = [
  { label: '', color: '' },
  { label: 'Weak', color: 'bg-red-500' },
  { label: 'Fair', color: 'bg-orange-400' },
  { label: 'Good', color: 'bg-yellow-400' },
  { label: 'Strong', color: 'bg-green-500' },
];

const InputField = ({
  name,
  label,
  type = 'text',
  placeholder,
  icon,
  showIcon,
  hideIcon,
  validate,
  value,
  onChange,
  inputRef,
}) => {
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [strength, setStrength] = useState(0);

  const internalRef = useRef(null);
  const timerRef = useRef(null);

  const toggleVisibility = () => setVisible(v => !v);

  const handleChange = (val) => {
    if (!dirty) setDirty(true);
    onChange(val);
  };

  // =========================
  // Debounced validation
  // =========================
  useEffect(() => {
    if (!dirty || !validate) return;

    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setError(validate(value) || '');
    }, 500);

    return () => clearTimeout(timerRef.current);
  }, [value, validate, dirty]);

  // =========================
  // Password strength
  // =========================
  useEffect(() => {
    if (type !== 'password') return;

    setStrength(getPasswordStrength(value));
  }, [value, type]);

  // =========================
  // States
  // =========================
  const isInvalid = dirty && Boolean(error);
  const isValid = dirty && !error && value;

  const strengthInfo = strengthMeta[strength];

  const borderClass = isInvalid
    ? 'border-red-500'
    : isValid
      ? 'border-green-500'
      : 'border-gray-300';

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
          ref={(el) => {
            internalRef.current = el;
            if (inputRef) inputRef.current = el;
          }}
          name={name}
          type={visible ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const form = e.currentTarget.form;
              const inputs = Array.from(form.elements);
              const index = inputs.indexOf(e.currentTarget);
              inputs[index + 1]?.focus();
            }
          }}
          className="flex-1 outline-none"
        />

        {type === 'password' && (showIcon || hideIcon) && (
          <span onClick={toggleVisibility} className="ml-2 cursor-pointer">
            {visible ? hideIcon : showIcon}
          </span>
        )}
      </div>

      {/* Password Strength */}
      {type === 'password' && dirty && value && (
        <div className="mt-2">
          <div className="h-2 w-full bg-gray-200 rounded">
            <div
              className={`h-2 rounded transition-all duration-300 ${strengthInfo.color}`}
              style={{ width: `${(strength / 4) * 100}%` }}
            />
          </div>
          <p className="text-xs mt-1 text-gray-600">
            Strength: {strengthInfo.label}
          </p>
        </div>
      )}

      {isInvalid && (
        <p className="text-red-600 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default InputField;