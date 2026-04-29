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
  if (password.length < 8) return 'Password must be at least 8 characters.';
  return '';
};

export const validateFullName = (name) => {
  if (!name) return 'Full name is required.';
  if (name.length < 2) return 'Name must be at least 2 characters.';
  return '';
};

export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '' };

  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

  return {
    score,
    label: labels[Math.max(0, score - 1)],
  };
};