import React, { useState } from 'react';

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
  showError = false,
}) => {
  const [visible, setVisible] = useState(false);

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const toggleVisibility = () => setVisible(!visible);

  const errorMessage = validate && showError ? validate(value) : '';

  return (
    <div className="flex flex-col">
      <label className="mb-1 font-medium">{label}</label>
      <div className="flex items-center border border-gray-300 rounded px-3 py-2 focus-within:border-blue-500 transition">
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
        <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
      )}
    </div>
  );
};

export default InputField;