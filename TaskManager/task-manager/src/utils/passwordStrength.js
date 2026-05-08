export const getStrengthColor = (score) => {
  if (score <= 1) return 'bg-red-500';
  if (score === 2) return 'bg-orange-500';
  if (score === 3) return 'bg-yellow-500';
  if (score === 4) return 'bg-blue-500';

  return 'bg-green-500';
};

export const getStrengthWidth = (score) => {
  return `${(score / 5) * 100}%`;
};

export const PASSWORD_RULES = [
  {
    key: 'length',
    label: '8+ characters',
  },
  {
    key: 'upper',
    label: 'Uppercase',
  },
  {
    key: 'lower',
    label: 'Lowercase',
  },
  {
    key: 'number',
    label: 'Number',
  },
  {
    key: 'special',
    label: 'Special Character',
  },
];