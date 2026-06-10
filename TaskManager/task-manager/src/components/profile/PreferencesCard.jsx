import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import {
  getPreferences,
  savePreferences,
} from '../../utils/userPreferences';

const PreferencesCard = () => {
  const [preferences, setPreferences] = useState(getPreferences);

  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    const value =
      e.target.type === 'checkbox'
        ? e.target.checked
        : e.target.value;

    const updated = {
      ...preferences,
      [field]: value,
    };

    setPreferences(updated);
    savePreferences(updated);
  };
  const handleSave = () => {
    savePreferences(preferences);

    toast.success('Preferences saved', {
      icon: '✅',
      style: {
        background: '#10b981',
        color: '#fff',
      },
    });

    if (preferences.defaultStartPage) {
      navigate(preferences.defaultStartPage);
    }
  };

  return (
    <div className="space-y-6">
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
          Default Start Page
        </label>

        <select
          value={preferences.defaultStartPage}
          onChange={handleChange('defaultStartPage')}
          className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-[var(--app-text)] outline-none focus:border-[var(--app-primary)]"
        >
          <option value="/">Home</option>
          <option value="/todos">Todos</option>
          <option value="/user-info">Account Settings</option>
        </select>
      </div>

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