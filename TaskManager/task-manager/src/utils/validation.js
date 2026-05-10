export const validateEmail = (email) => {
  if (!email) return 'Email is required';

  const value = email.trim();

  // Basic structure check
  const emailRegex =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

  if (!emailRegex.test(value)) {
    return 'Invalid email format';
  }

  // ❌ Reject consecutive dots
  if (value.includes('..')) {
    return 'Invalid email format';
  }

  // ❌ Reject invalid domain patterns
  const domain = value.split('@')[1];

  if (
    domain.startsWith('.') ||
    domain.endsWith('.') ||
    domain.includes('./') ||
    domain.includes('/.')
  ) {
    return 'Invalid email format';
  }

  return '';
};

export const validatePassword = (password) => {

  if (!password) return 'Password is required.';

  const { rules, isValid } = getPasswordStrength(password);

  if (isValid) return '';

  const failed = [];

  if (!rules.length) failed.push('8+ characters');

  if (!rules.upper) failed.push('Uppercase letter');

  if (!rules.lower) failed.push('Lowercase letter');

  if (!rules.number) failed.push('Number');

  if (!rules.special) failed.push('Special character');

  return `Password must include: ${failed.join(', ')}`;

};

export const validateConfirmPassword = (confirmPassword, formData) => {
  if (!confirmPassword)
    return 'Please confirm your password.';

  if (confirmPassword !== formData.password)
    return 'Passwords do not match.';

  return '';
};

export const validateFullName = (name) => {
  if (!name) return 'Full name is required.';
  if (name.length < 2) return 'Name must be at least 2 characters.';
  return '';
};

export const getPasswordStrength = (password) => {
  const value = password || '';

  const rules = {
    length: value.length >= 8,
    upper: /[A-Z]/.test(value),
    lower: /[a-z]/.test(value),
    number: /\d/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
  };

  const score = Object.values(rules).filter(Boolean).length;

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

  return {
    score,
    label: labels[Math.max(0, score - 1)] || '',
    rules,
    isValid: score === 5, // ✅ single truth
  };
};