export const getInitials = (fullName = '') => {
  return fullName
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('');
};