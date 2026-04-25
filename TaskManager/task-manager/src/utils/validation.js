export const validateEmail = (email) => {
  if (!email) return 'Email is required';

  const value = email.trim();

  // Basic structure: something@something.something
  const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicRegex.test(value)) {
    return 'Invalid email format';
  }

  // Prevent consecutive dots (your current bug)
  if (value.includes('..')) {
    return 'Email cannot contain consecutive dots';
  }

  const [local, domain] = value.split('@');

  // Prevent leading/trailing dots
  if (local.startsWith('.') || local.endsWith('.')) {
    return 'Invalid email format';
  }

  if (domain.startsWith('.') || domain.endsWith('.')) {
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