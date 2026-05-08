import React, { useMemo } from 'react';

import PasswordRule from './PasswordRule';

import { getPasswordStrength } from '../../utils/validation';

import {
  getStrengthColor,
  getStrengthWidth,
  PASSWORD_RULES,
} from '../../utils/passwordStrength';

const PasswordStrength = ({ password }) => {
  const strength = useMemo(() => {
    return getPasswordStrength(password || '');
  }, [password]);

  const rules = strength.rules || {};

  const color = getStrengthColor(strength.score);

  const width = getStrengthWidth(strength.score);

  return (
    <div className="mt-3 space-y-2">

      {/* Strength Bar */}
      <div className="h-2 bg-gray-200 rounded">
        <div
          className={`h-2 rounded transition-all duration-300 ${color}`}
          style={{ width }}
        />
      </div>

      {/* Label */}
      <p className="text-xs text-gray-600">
        Strength: {strength.label || '—'}
      </p>

      {/* Rules */}
      <div className="grid grid-cols-2 gap-1">
        {PASSWORD_RULES.map((rule) => (
          <PasswordRule
            key={rule.key}
            ok={!!rules[rule.key]}
            text={rule.label}
          />
        ))}
      </div>

    </div>
  );
};

export default PasswordStrength;