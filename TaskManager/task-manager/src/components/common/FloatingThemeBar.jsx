import React, { useEffect, useState } from 'react';

import {
  applyTheme,
  getPreferences,
  savePreferences,
} from '../../utils/userPreferences';

const THEMES = [
  { value: 'light', label: '☀️' },
  { value: 'dark', label: '🌙' },
  // { value: 'system', label: '💻' },
];

const FloatingThemeBar = () => {
  const [theme, setTheme] = useState(
    getPreferences().theme
  );

  useEffect(() => {
    const preferences = getPreferences();

    const updated = {
      ...preferences,
      theme,
    };

    savePreferences(updated);
    applyTheme(theme);
  }, [theme]);

  return (
    <div className="fixed bottom-5 right-5 z-50 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] p-2 shadow-xl">
      <div className="flex items-center gap-1">
        {THEMES.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setTheme(item.value)}
            title={item.value}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition ${theme === item.value
              ? 'bg-[var(--app-primary)] text-white'
              : 'text-[var(--app-text)] hover:bg-[var(--app-surface-muted)]'
              }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FloatingThemeBar;