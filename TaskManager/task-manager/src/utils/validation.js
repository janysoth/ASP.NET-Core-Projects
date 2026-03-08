export const validateEmail = (email) => {
  if (!email) return 'Email is required.';
  if (!/\S+@\S+\.\S+/.test(email)) return 'Email is invalid.';
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