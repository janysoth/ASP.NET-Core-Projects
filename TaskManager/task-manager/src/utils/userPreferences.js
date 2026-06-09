const STORAGE_KEY = 'userPreferences';

export const defaultPreferences = {
  theme: 'light',
  compactMode: false,
  reduceMotion: false,
  sessionWarningMinutes: 5,
  emailNotifications: true,
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12-hour',
};

export const getPreferences = () => {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) return defaultPreferences;

  try {
    return {
      ...defaultPreferences,
      ...JSON.parse(stored),
    };
  } catch {
    return defaultPreferences;
  }
};

export const savePreferences = (preferences) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(preferences)
  );
};

export const applyTheme = (theme) => {
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
    return;
  }

  if (theme === 'light') {
    root.classList.remove('dark');
    return;
  }

  const prefersDark =
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  root.classList.toggle('dark', prefersDark);
};