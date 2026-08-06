import React, {
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  AppModal,
} from '@/components/ui';

import {
  AuthContext,
} from '@/context/AuthContext';

/*===========================================================
  SessionWarningModal:
  => Warns the user before inactivity logout.
  => Cannot be dismissed with Escape or backdrop clicks.
  => Requires the user to continue or log out.
===========================================================*/
const SessionWarningModal = () => {
  const {
    showWarning,
    timeRemaining,
    extendSession,
    logout,
  } = useContext(
    AuthContext
  );

  const navigate =
    useNavigate();

  const [
    displayTime,
    setDisplayTime,
  ] = useState('00:00');

  /*===========================================================
    Countdown display:
    => Converts milliseconds into MM:SS.
  ===========================================================*/
  useEffect(() => {
    if (
      !showWarning ||
      timeRemaining == null
    ) {
      setDisplayTime(
        '00:00'
      );

      return undefined;
    }

    const updateDisplayTime = () => {
      const totalSeconds =
        Math.max(
          0,
          Math.ceil(
            timeRemaining /
            1000
          )
        );

      const minutes =
        Math.floor(
          totalSeconds /
          60
        );

      const seconds =
        totalSeconds %
        60;

      setDisplayTime(
        `${minutes
          .toString()
          .padStart(
            2,
            '0'
          )}:${seconds
            .toString()
            .padStart(
              2,
              '0'
            )}`
      );
    };

    updateDisplayTime();

    const interval =
      window.setInterval(
        updateDisplayTime,
        1000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    showWarning,
    timeRemaining,
  ]);

  /*===========================================================
    Continue session:
    => Resets the inactivity timer.
  ===========================================================*/
  const handleContinueSession = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    extendSession();
  };

  /*===========================================================
    Logout now:
    => Clears the authenticated session.
    => Returns the user to Login.
  ===========================================================*/
  const handleLogoutNow = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    logout();

    navigate(
      '/login',
      {
        replace:
          true,
      }
    );
  };

  return (
    <AppModal
      isOpen={showWarning}
      onClose={() => { }}
      closeOnEscape={false}
      closeOnBackdrop={false}
      maxWidth="max-w-md"
      ariaLabelledBy="session-warning-title"
      ariaDescribedBy="session-warning-description"
    >
      <div className="p-6">
        <h3
          id="session-warning-title"
          className="text-xl font-bold text-[var(--app-text)]"
        >
          Are you still there?
        </h3>

        <p
          id="session-warning-description"
          className="mt-2 text-[var(--app-text-muted)]"
        >
          You will be logged out soon because no activity was detected.
        </p>

        <div className="my-6 text-center text-3xl font-bold text-red-500">
          {displayTime}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={
              handleContinueSession
            }
            className="flex-1 rounded-lg bg-[var(--app-primary)] px-4 py-2 font-semibold text-white transition-colors hover:bg-[var(--app-primary-hover)]"
          >
            Continue Session
          </button>

          <button
            type="button"
            onClick={
              handleLogoutNow
            }
            className="flex-1 rounded-lg border border-red-500 px-4 py-2 font-semibold text-red-500 transition-colors hover:bg-red-500 hover:text-white"
          >
            Logout Now
          </button>
        </div>
      </div>
    </AppModal>
  );
};

export default SessionWarningModal;