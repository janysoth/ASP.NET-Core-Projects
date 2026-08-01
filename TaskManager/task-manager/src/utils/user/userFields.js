import {
  EyeIcon,
  EyeOffIcon,
  LockIcon
} from "../../components/icons/Icons";
import {
  validateConfirmPassword,
  validatePassword
} from "../validation";

export const CHANGE_PASSWORD_FIELDS = [
  {
    name: 'currentPassword',
    label: 'Current Password',
    type: 'password',
    placeholder: 'Enter your current password',
    icon: <LockIcon />,
    showIcon: <EyeIcon />,
    hideIcon: <EyeOffIcon />,
    required: true,
  },

  {
    name: 'newPassword',
    label: 'New Password',
    type: 'password',
    placeholder: 'Enter your new password',
    icon: <LockIcon />,
    showIcon: <EyeIcon />,
    hideIcon: <EyeOffIcon />,
    required: true,
    validate: validatePassword,
    showStrength: true,
  },

  {
    name: 'confirmPassword',
    label: "Confirm Password",
    type: 'password',
    placeholder: 'Confirm your new password',
    icon: <LockIcon />,
    showIcon: <EyeIcon />,
    hideIcon: <EyeOffIcon />,
    required: true,

    validate: (value, formData) =>
      validateConfirmPassword(value, formData, 'newPassword'),
  }
];

export const USER_PASSWORD_FIELDS = [

  {
    name: 'currentPassword',
    label: 'Current Password',
    type: 'password',
    icon: <LockIcon />,
    showIcon: <EyeIcon />,
    hideIcon: <EyeOffIcon />,
    validate: validatePassword,
  },

  {
    name: 'newPassword',
    label: 'New Password',
    type: 'password',
    icon: <LockIcon />,
    showIcon: <EyeIcon />,
    hideIcon: <EyeOffIcon />,
    validate: validatePassword,
  },

  {
    name: 'confirmPassword',
    label: 'Confirm Password',
    type: 'password',
    icon: <LockIcon />,
    showIcon: <EyeIcon />,
    hideIcon: <EyeOffIcon />,
    validate: (value, formData) =>
      validateConfirmPassword(value, formData, 'newPassword'),
  },

];

