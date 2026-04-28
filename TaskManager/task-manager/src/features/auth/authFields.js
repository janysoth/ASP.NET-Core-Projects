import {
  EmailIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  UserIcon,
} from '../../components/icons/Icons';
import { checkEmailExists } from '../../services/api';

import {
  validateEmail,
  validateFullName,
  validatePassword,
} from '../../utils/validation';

// =========================
// Login Fields
// =========================
export const LOGIN_FIELDS = [
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'Enter your email',
    icon: <EmailIcon />,
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    validate: validateEmail,
    normalize: (v) => v.trim(),
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    icon: <LockIcon />,
    showIcon: <EyeIcon />,
    hideIcon: <EyeOffIcon />,
    required: true,
    minLength: 6,
    validate: validatePassword,
  },
];

// =========================
// Register Fields
// =========================
export const REGISTER_FIELDS = [
  {
    name: 'fullName',
    label: 'Full Name',
    type: 'text',
    placeholder: 'Enter your full name',
    icon: <UserIcon />,
    required: true,
    minLength: 2,
    validate: validateFullName,
    normalize: (v) => v.trim(),
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: "Enter your email",
    icon: <EmailIcon />,
    required: true,
    normalize: (v) => v.trim(),
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    validate: validateEmail,

    asyncValidate: async (value) => {
      if (!value) return '';

      const res = await checkEmailExists(value);
      return res.data.exists ? 'Email already in use' : '';
    }
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Create a password',
    showStrength: true,
    icon: <LockIcon />,
    showIcon: <EyeIcon />,
    hideIcon: <EyeOffIcon />,
    required: true,
    minLength: 6,
    validate: validatePassword,
  },
];