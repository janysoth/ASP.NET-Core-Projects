import React, { useEffect, useRef, useState } from 'react';

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

  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);

  const timerRef = useRef(null);

  const toggleVisibility = () => setVisible(v => !v);

  // =========================
  // mark user interaction
  // =========================
  const handleChange = (val) => {
    if (!dirty) setDirty(true);
    onChange(val);
  };

  // =========================
  // debounced validation
  // =========================
  useEffect(() => {
    if (!dirty || !validate) return;

    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const message = validate(value);
      setError(message || '');
    }, 500);

    return () => clearTimeout(timerRef.current);
  }, [value, validate, dirty]);

  const isInvalid = dirty && Boolean(error);

  return (
    <div className="flex flex-col">
      <label className="mb-1 font-medium">{label}</label>

      <div
        className={`
          flex items-center border rounded px-3 py-2 transition
          focus-within:border-blue-500
          ${isInvalid ? 'border-red-500' : 'border-gray-300'}
        `}
      >
        {icon && <span className="mr-2">{icon}</span>}

        <input
          type={visible ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className="flex-1 outline-none"
        />

        {type === 'password' && (showIcon || hideIcon) && (
          <span onClick={toggleVisibility} className="ml-2 cursor-pointer">
            {visible ? hideIcon : showIcon}
          </span>
        )}
      </div>

      {isInvalid && (
        <p className="text-red-600 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default InputField;