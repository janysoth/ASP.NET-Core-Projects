import React, { useMemo } from 'react';
import { getPasswordStrength } from '../../utils/validation';

const PasswordStrength = ({ password }) => {
  const strength = useMemo(() => {
    if (!password || password.length < 6) return null;

    return getPasswordStrength(password);
  });

  return (
    <div>PasswordStrength</div>
  );
};

export default PasswordStrength;