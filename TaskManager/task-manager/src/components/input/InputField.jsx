import React, { useState } from 'react';

const InputField = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon,
  showIcon,
  hideIcon
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div>
      {label && (
        <label className="block text-gray-700 font-medium mb-1">
          {label}
        </label>
      )}

      <div className="relative">

        {/* Left icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full p-3 border border-gray-300 rounded-md
            focus:outline-none focus:ring-2 focus:ring-indigo-400
            focus:border-indigo-400 transition
            ${icon ? 'pl-10' : ''}
            ${isPassword ? 'pr-12' : ''}`}
        />

        {/* Password Toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-indigo-600"
          >
            {showPassword ? showIcon : hideIcon}
          </button>
        )}

      </div>
    </div>
  );
};

export default InputField;