import React from 'react';

const PasswordRule = ({ ok, text }) => {
  return (
    <div
      className={`text-xs ${ok ? 'text-green-600' : 'text-gray-400'
        }`}
    >
      {ok ? '✔' : '•'} {text}
    </div>
  );
};

export default PasswordRule;