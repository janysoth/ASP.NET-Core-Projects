import React, { useMemo } from 'react';
import { getPasswordStrength } from '../../utils/validation';

const PasswordStrength = ({ password }) => {
  const strength = useMemo(() => {
    if (!password || password.length < 6) return null;
    return getPasswordStrength(password);
  }, [password]);

  if (!strength) return null;

  const rules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const width = `${(strength.score / 5) * 100}%`;

  const color =
    strength.score <= 1 ? 'bg-red-500' :
      strength.score === 2 ? 'bg-orange-500' :
        strength.score === 3 ? 'bg-yellow-500' :
          strength.score === 4 ? 'bg-blue-500' :
            'bg-green-500';

  const Rule = ({ ok, text }) => (
    <div className={`text-xs ${ok ? 'text-green-600' : 'text-gray-400'}`}>
      {ok ? '✔' : '•'} {text}
    </div>
  );

  return (
    <div className="mt-3 space-y-2">
      <div className="h-2 bg-gray-200 rounded">
        <div
          className={`h-2 rounded transition-all duration-300 ${color}`}
          style={{ width }}
        />
      </div>

      <p className="text-xs text-gray-600">
        Strength: {strength.label}
      </p>

      <div className="grid grid-cols-2 gap-1">
        <Rule ok={rules.length} text="8+ chars" />
        <Rule ok={rules.upper} text="Uppercase" />
        <Rule ok={rules.lower} text="Lowercase" />
        <Rule ok={rules.number} text="Number" />
        <Rule ok={rules.special} text="Special char" />
      </div>
    </div>
  );
};

export default PasswordStrength;