import React, { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AuthContext } from '../../context/AuthContext';

const SessionWarningModal = () => {
  const { showWarning, timeRemaining, extendSession, logout } =
    useContext(AuthContext);

  const [displayTime, setDisplayTime] = useState('00:00');

  useEffect(() => {
    if (!showWarning) return;

    const tick = () => {
      const totalSeconds = Math.ceil(timeRemaining / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      setDisplayTime(
        `${minutes.toString().padStart(2, '0')}:${seconds
          .toString()
          .padStart(2, '0')}`
      );
    };

    tick(); // initial render
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [showWarning, timeRemaining]);

  if (!showWarning) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Overlay under the modal */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal box with pointer-events-auto */}
      <div className="relative z-10 bg-white p-6 rounded-xl max-w-md w-full mx-4 animate-fade-in pointer-events-auto">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Session Expiring Soon
        </h3>

        <p className="text-gray-600 mb-4">
          You will be logged out due to inactivity.
        </p>

        <div className="text-3xl font-bold text-red-500 mb-6 text-center">
          {displayTime}
        </div>

        <div className="flex gap-3">
          <button
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SessionWarningModal;