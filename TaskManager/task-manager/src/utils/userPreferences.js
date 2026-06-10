const STORAGE_KEY = 'userPreferences';

export const defaultPreferences = {
  theme: 'light',
  compactMode: false,
  reduceMotion: false,
  sessionWarningMinutes: 5,
  emailNotifications: true,
  defaultStartPage: '/',
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
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    const prefersDark =
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    root.classList.toggle('dark', prefersDark);
  }
};

export const applyLayoutPreferences = (preferences) => {
  const root = document.documentElement;

  root.classList.toggle(
    'compact-mode',
    !!preferences.compactMode
  );

  root.classList.toggle(
    'reduce-motion',
    !!preferences.reduceMotion
  );
};

export const applyAllPreferences = () => {
  const preferences = getPreferences();

  applyTheme(preferences.theme);
  applyLayoutPreferences(preferences);
};