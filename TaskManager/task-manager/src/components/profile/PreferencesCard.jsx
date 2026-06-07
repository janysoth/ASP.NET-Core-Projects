import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import {
  applyTheme,
  getPreferences,
  savePreferences,
} from '../../utils/userPreferences';

const PreferencesCard = () => {
  const [preferences, setPreferences] = useState(getPreferences);

  useEffect(() => {
    savePreferences(preferences);
    applyTheme(preferences.theme);
  }, [preferences]);

  const handleChange = (field) => (e) => {
    const value =
      e.target.type === 'checkbox'
        ? e.target.checked
        : e.target.value;

    setPreferences((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    savePreferences(preferences);
    applyTheme(preferences.theme);

    toast.success('Preferences saved', {
      icon: '✅',
      style: {
        background: '#10b981',
        color: '#fff',
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block font-medium text-[var(--app-text)]">
          Theme
        </label>

        <select
          value={preferences.theme}
          onChange={handleChange('theme')}
          className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-[var(--app-text)] outline-none focus:border-[var(--app-primary)]"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </div>

      <label className="flex items-center justify-between gap-4 rounded-xl bg-[var(--app-surface-muted)] p-4">
        <div>
          <p className="font-medium text-[var(--app-text)]">
            Compact Layout
          </p>
          <p className="text-sm text-[var(--app-text-muted)]">
            Reduce spacing across supported screens.
          </p>
        </div>

        <input
          type="checkbox"
          checked={preferences.compactMode}
          onChange={handleChange('compactMode')}
        />
      </label>

      <label className="flex items-center justify-between gap-4 rounded-xl bg-[var(--app-surface-muted)] p-4">
        <div>
          <p className="font-medium text-[var(--app-text)]">
            Reduce Motion
          </p>
          <p className="text-sm text-[var(--app-text-muted)]">
            Minimize animations where supported.
          </p>
        </div>

        <input
          type="checkbox"
          checked={preferences.reduceMotion}
          onChange={handleChange('reduceMotion')}
        />
      </label>

      <div>
        <label className="mb-2 block font-medium text-[var(--app-text)]">
          Session Warning
        </label>

        <select
          value={preferences.sessionWarningMinutes}
          onChange={handleChange('sessionWarningMinutes')}
          className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-[var(--app-text)] outline-none focus:border-[var(--app-primary)]"
        >
          <option value={1}>1 minute before logout</option>
          <option value={3}>3 minutes before logout</option>
          <option value={5}>5 minutes before logout</option>
          <option value={10}>10 minutes before logout</option>
        </select>
      </div>

      <label className="flex items-center justify-between gap-4 rounded-xl bg-[var(--app-surface-muted)] p-4">
        <div>
          <p className="font-medium text-[var(--app-text)]">
            Email Notifications
          </p>
          <p className="text-sm text-[var(--app-text-muted)]">
            Receive account and security notifications.
          </p>
        </div>

        <input
          type="checkbox"
          checked={preferences.emailNotifications}
          onChange={handleChange('emailNotifications')}
        />
      </label>

      <button
        type="button"
        onClick={handleSave}
        className="rounded-lg bg-[var(--app-primary)] px-4 py-2 text-white hover:bg-[var(--app-primary-hover)]"
      >
        Save Preferences
      </button>
    </div>
  );
};

export default PreferencesCard;