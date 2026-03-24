import React from 'react';
import { createPortal } from 'react-dom';

const SessionWarningModal = ({ show }) => {
  if (!show) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999999] flex items-center justify-center pointer-events-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div
        className="bg-white p-6 rounded-xl pointer-events-auto z-[10000000] max-w-md w-full mx-4 animate-fade-in"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Session Expiring Soon
        </h3>
        <p className="text-gray-600 mb-4">
          Your session will expire in 5 minutes due to inactivity.
        </p>
        <div className="flex gap-3">
          <button
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SessionWarningModal;