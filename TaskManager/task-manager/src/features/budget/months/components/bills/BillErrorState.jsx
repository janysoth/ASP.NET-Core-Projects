import React from 'react';

import {
  AppButton,
} from '@/components/ui';

/*===========================================================
  BillErrorState:
  => Displays bill loading errors.
===========================================================*/
const BillErrorState = ({
  error,
  onRetry,
}) => {
  return (
    <div className="p-5">
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
        <p className="text-sm font-semibold text-red-700 dark:text-red-300">
          Unable to load bills
        </p>

        <p className="mt-1 text-sm text-red-600 dark:text-red-300">
          {error}
        </p>

        <div className="mt-3">
          <AppButton
            variant="danger"
            size="sm"
            onClick={onRetry}
          >
            Try again
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default BillErrorState;