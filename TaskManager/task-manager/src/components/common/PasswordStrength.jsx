import React, { useMemo } from 'react';

import { getStrengthColor, PASSWORD_RULES } from '../../utils/passwordStrength';
import { getPasswordStrength } from '../../utils/validation';

const PasswordStrength = ({ password }) => {
  const strength = useMemo(() => {
    return getPasswordStrength(password || '');
  }, [password]);

  if (!password || strength.isValid) return null;

  const Rule = ({ ok, text }) => (
    <div
      className={`
        flex items-center gap-2 text-xs transition-all
        ${ok ? 'text-green-600' : 'text-gray-400 opacity-60'}
      `}
    >
      <div
        className={`
          w-4 h-4 rounded-full flex items-center justify-center text-[10px]
          ${ok
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-200 text-gray-400'}
        `}
      >
        {ok ? '✓' : ''}
      </div>

      <span>{text}</span>
    </div>
  );

  return (
    <div className="mt-3 space-y-3 animate-in fade-in duration-200">

      {/* Strength Bar */}
      <div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`
              h-2 rounded-full transition-all duration-300
              ${getStrengthColor(strength.score)}
            `}
            style={{
              width: getStrengthColor(strength.score),
            }}
          />
        </div>

        <p className="text-xs text-gray-600 mt-1">
          Strength: {strength.label}
        </p>
      </div>

      {/* Rules */}
      <div className="grid grid-cols-2 gap-2">
        {PASSWORD_RULES.map((rule) => (
          <Rule
            key={rule.key}
            ok={strength.rules[rule.key]}
            text={rule.label}
          />
        ))}
      </div>

    </div>
  );
};

export default PasswordStrength;