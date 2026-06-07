import React from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CARDS } from '../utils/constants';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-6 py-10 bg-[var(--app-bg)]">
      <h1 className="text-3xl font-bold mb-8 text-[var(--app-text)]">
        My Apps
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {APP_CARDS.map((app) => (
          <button
            key={app.title}
            onClick={() => navigate(app.route)}
            className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 text-left shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="text-5xl mb-4">{app.icon}</div>

            <h2 className="text-xl font-semibold text-[var(--app-text)]">
              {app.title}
            </h2>

            <p className="text-[var(--app-text-muted)] mt-2 text-sm">
              {app.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomePage;