import React, {
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  AppButton,
  AppModal,
  ModalActions,
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
    => Converts remaining milliseconds into MM:SS.
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
    handleContinueSession:
    => Explicitly resets the inactivity timer.
    => Closes the warning modal.
  ===========================================================*/
  const handleContinueSession = () => {
    extendSession();
  };

  /*===========================================================
    handleLogoutNow:
    => Logs the user out immediately.
    => Redirects back to Login.
  ===========================================================*/
  const handleLogoutNow = () => {
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
      isOpen={
        showWarning
      }
      onClose={() => { }}
      closeOnEscape={
        false
      }
      closeOnBackdrop={
        false
      }
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

        {/*=====================================================
          Countdown
        =====================================================*/}
        <div className="my-6 text-center text-3xl font-bold text-red-500">
          {displayTime}
        </div>

        {/*=====================================================
          Actions
        =====================================================*/}
        <ModalActions>
          <AppButton
            variant="danger"
            onClick={
              handleLogoutNow
            }
            className="sm:flex-1"
          >
            Logout Now
          </AppButton>

          <AppButton
            variant="primary"
            onClick={
              handleContinueSession
            }
            className="sm:flex-1"
          >
            Continue Session
          </AppButton>
        </ModalActions>
      </div>
    </AppModal>
  );
};

export default SessionWarningModal;