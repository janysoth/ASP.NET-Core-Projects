import React, { useState } from 'react';

const InputField = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // Determine if this is a password field
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="relative">
      {label && (
        <label className="block text-gray-700 font-medium mb-1">
          {label}
        </label>
      )}

      <input
        type={inputType}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full p-3 border border-gray-300 rounded-md 
          focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition
          ${isPassword ? 'pr-12' : ''}`}
      />

      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[65%] transform -translate-y-1/2 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-indigo-600 focus:outline-none"
        >
          {showPassword ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.15 21.15 0 0 1 5.06-6.94M1 1l22 22" />
              <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

export default InputField;