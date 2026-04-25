export const validateEmail = (email = '') => {
  const value = email.trim();

  if (!value) return 'Email is required';

  // basic format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(value)) {
    return 'Invalid email format';
  }

  // extra safety rules
  if (value.includes('..')) {
    return 'Email cannot contain consecutive dots';
  }

  if (value.startsWith('.') || value.endsWith('.')) {
    return 'Email cannot start or end with a dot';
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