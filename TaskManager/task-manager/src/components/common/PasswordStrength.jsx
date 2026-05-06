import React, { useMemo } from 'react';
import { getPasswordStrength } from '../../utils/validation';

const PasswordStrength = ({ password }) => {
  const strength = useMemo(() => {
    return getPasswordStrength(password || '');
  }, [password]);

  const rules = strength.rules || {};

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

      {/* bar always exists */}
      <div className="h-2 bg-gray-200 rounded">
        <div
          className={`h-2 rounded transition-all duration-300 ${color}`}
          style={{ width }}
        />
      </div>

      {/* label fallback */}
      <p className="text-xs text-gray-600">
        Strength: {strength.label || '—'}
      </p>

      {/* checklist always renders safely */}
      <div className="grid grid-cols-2 gap-1">
        <Rule ok={!!rules.length} text="8+ chars" />
        <Rule ok={!!rules.upper} text="Uppercase" />
        <Rule ok={!!rules.lower} text="Lowercase" />
        <Rule ok={!!rules.number} text="Number" />
        <Rule ok={!!rules.special} text="Special char" />
      </div>

    </div>
  );
};

export default PasswordStrength;