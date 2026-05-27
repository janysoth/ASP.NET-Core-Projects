import React from 'react';

const getInitials = (fullName = '') => {
  const parts = fullName
    .trim()
    .split(' ')
    .filter(Boolean);

  if (!parts.length) return '?';

  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
};

const Avatar = ({
  fullName,
  profileImageUrl,
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-20 h-20 text-2xl',
    xl: 'w-28 h-28 text-4xl',
  };

  const classes =
    sizeMap[size] || sizeMap.md;

  if (profileImageUrl) {
    return (
      <img
        src={profileImageUrl}
        alt={fullName}
        className={`${classes} rounded-full object-cover border`}
      />
    );
  }

  return (
    <div
      className={`
        ${classes}
        rounded-full
        bg-indigo-600
        text-white
        flex
        items-center
        justify-center
        font-semibold
        border
      `}
    >
      {getInitials(fullName)}
    </div>
  );
};

export default Avatar;