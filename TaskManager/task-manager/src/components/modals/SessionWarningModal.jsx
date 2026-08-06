import React, {
  useContext,
  useEffect,
  useState,
} from 'react';

import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

import { AuthContext } from '../../context/AuthContext';

const SessionWarningModal = () => {
  const {
    showWarning,
    timeRemaining,
    extendSession,
    logout,
  } = useContext(AuthContext);

  const navigate = useNavigate();

  const [displayTime, setDisplayTime] =
    useState('00:00');

  useEffect(() => {
    if (!showWarning || !timeRemaining) return;

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

    tick();

    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [showWarning, timeRemaining]);

  const handleLogoutNow = (e) => {
    e.preventDefault();
    e.stopPropagation();

    logout();
    navigate('/login', { replace: true });
  };

  if (!showWarning) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" />

      <div className="pointer-events-auto relative z-10 mx-4 w-full max-w-md rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-xl">
        <h3 className="mb-2 text-xl font-bold text-[var(--app-text)]">
          Are you still there?
        </h3>

        <p className="mb-4 text-[var(--app-text-muted)]">
          You will be logged out soon because no activity was detected.
        </p>

        <div className="mb-6 text-center text-3xl font-bold text-red-500">
          {displayTime}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              extendSession();
            }}
            className="flex-1 rounded-lg bg-[var(--app-primary)] px-4 py-2 font-semibold text-white hover:bg-[var(--app-primary-hover)]"
          >
            Continue Session
          </button>
          <button
            type="button"
            onMouseDown={handleLogoutNow}
            className="flex-1 rounded-lg border border-red-500 px-4 py-2 font-semibold text-red-500 hover:bg-red-500 hover:text-white"
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SessionWarningModal;