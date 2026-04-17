import { getTodayLocalDateString } from './helpers';

// =========================
// AUTH FORMS
// =========================

export const getLoginFormState = () => ({
  email: '',
  password: '',
});

export const getRegisterFormState = () => ({
  fullName: '',
  email: '',
  password: '',
});

export const getForgotPasswordFormState = () => ({
  email: '',
});

export const getResetPasswordFormState = () => ({
  email: '',
  token: '',
  newPassword: '',
  confirmPassword: '',
});

// =========================
// USER SETTINGS
// =========================

export const getChangePasswordFormState = () => ({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// =========================
// TODO FORM
// =========================

export const getTodoFormState = () => ({
  title: '',
  description: '',
  dueDate: getTodayLocalDateString(),
});