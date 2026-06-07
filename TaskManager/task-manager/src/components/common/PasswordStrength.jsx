import React, { useMemo } from 'react';
import {
  getPasswordStrength,
} from '../../utils/validation';

const PasswordStrength = ({ password }) => {
  const strength = useMemo(() => {
    if (!password) return null;
    return getPasswordStrength(password);
  }, [password]);

  if (!strength) return null;

  const { score, label, rules } = strength;

  const width = `${(score / 5) * 100}%`;

  const color =
    score <= 1 ? 'bg-red-500' :
      score === 2 ? 'bg-orange-500' :
        score === 3 ? 'bg-yellow-500' :
          score === 4 ? 'bg-blue-500' :
            'bg-green-500';

  const Rule = ({ ok, text }) => (
    <div
      className={`text-xs ${ok
          ? 'text-green-500'
          : 'text-[var(--app-text-muted)] opacity-70'
        }`}
    >
      {ok ? '✔' : '•'} {text}
    </div>
  );

  return (
    <div className="mt-3 space-y-2">
      <div className="h-2 rounded bg-[var(--app-surface-muted)]">
        <div
          className={`h-2 rounded transition-all ${color}`}
          style={{ width }}
        />
      </div>

      <p className="text-xs text-[var(--app-text-muted)]">
        Strength: {label}
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