import React, { useContext } from 'react';
import { createPortal } from 'react-dom';
import { AuthContext } from '../../context/AuthContext';

// Format milliseconds → MM:SS
const formatTime = (ms) => {
  if (!ms || ms <= 0) return '00:00';

  const totalSeconds = Math.ceil(ms / 1000);

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
};

const SessionWarningModal = () => {
  const { showWarning, timeRemaining, extendSession, logout } =
    useContext(AuthContext);

  if (!showWarning) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999999] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="bg-white p-6 rounded-xl max-w-md w-full mx-4 animate-fade-in">

        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Session Expiring Soon
        </h3>

        <p className="text-gray-600 mb-4">
          You will be logged out due to inactivity.
        </p>

        {/* ✅ Live countdown */}
        <div className="text-3xl font-bold text-red-500 mb-6 text-center">
          {formatTime(timeRemaining)}
        </div>

        <div className="flex gap-3">
          {/* Stay Logged In */}
          <button
            onClick={extendSession}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Stay Logged In
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex-1 bg-gray-300 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SessionWarningModal;