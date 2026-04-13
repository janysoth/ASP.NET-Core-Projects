import React from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CARDS } from '../utils/constants';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-6 py-10">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        My Apps
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {APP_CARDS.map((app) => (
          <button
            key={app.title}
            onClick={() => navigate(app.route)}
            className="bg-white rounded-2xl shadow-md p-6 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border border-gray-100"
          >
            <div className="text-5xl mb-4">{app.icon}</div>

            <h2 className="text-xl font-semibold text-gray-800">
              {app.title}
            </h2>

            <p className="text-gray-500 mt-2 text-sm">
              {app.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomePage;