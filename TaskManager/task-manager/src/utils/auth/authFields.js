import {
  EmailIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  UserIcon,
} from '../../components/icons/Icons';

import { checkEmailExists } from '../../services/api';

import {
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validatePassword,
} from '../validation';

// =========================
// Login
// =========================
export const LOGIN_FIELDS = [
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'Enter your email',
    icon: <EmailIcon />,
    validate: validateEmail,
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    icon: <LockIcon />,
    showIcon: <EyeIcon />,
    hideIcon: <EyeOffIcon />,
    validate: validatePassword,
  },
];

// =========================
// Register
// =========================
export const REGISTER_FIELDS = [
  {
    name: 'fullName',
    label: 'Full Name',
    type: 'text',
    placeholder: 'Enter your full name',
    icon: <UserIcon />,
    validate: validateFullName,
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'Enter your email',
    icon: <EmailIcon />,
    validate: validateEmail,

    asyncValidate: async (value) => {
      if (!value) return '';

      const res = await checkEmailExists(value);
      return res.data.exists ? 'Email already in use' : '';
    },
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Create password',
    icon: <LockIcon />,
    showIcon: <EyeIcon />,
    hideIcon: <EyeOffIcon />,
    validate: validatePassword,
  },

  // ✅ confirm password lives ONLY here
  {
    name: 'confirmPassword',
    label: 'Confirm Password',
    type: 'password',
    placeholder: 'Confirm password',
    icon: <LockIcon />,
    showIcon: <EyeIcon />,
    hideIcon: <EyeOffIcon />,

    validate: (value, formData) =>
      validateConfirmPassword(value, formData, 'password'),
  },
];