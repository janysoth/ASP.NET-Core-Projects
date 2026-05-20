import React from 'react';
import { getInitials } from '../../utils/avatar';

const SIZE_CLASSES = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-16 h-16 text-xl',
  lg: 'w-24 h-24 text-3xl',
};

const UserAvatar = ({
  fullName = '',
  image = '',
  size = 'md',
}) => {
  const initials = getInitials(fullName);

  const sizeClass =
    SIZE_CLASSES[size] || SIZE_CLASSES.md;

  // =========================
  // Uploaded Image
  // =========================
  if (image) {
    return (
      <img
        src={image}
        alt={fullName}
        className={`
          ${sizeClass}
          rounded-full
          object-cover
          border
          border-gray-200
          shadow-sm
        `}
      />
    );
  }

  // =========================
  // Initials Fallback
  // =========================
  return (
    <div
      className={`
        ${sizeClass}
        rounded-full
        bg-indigo-600
        text-white
        flex
        items-center
        justify-center
        font-semibold
        select-none
        shadow-sm
      `}
    >
      {initials || '?'}
    </div>
  );
};

export default UserAvatar;