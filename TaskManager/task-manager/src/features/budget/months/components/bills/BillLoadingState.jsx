import React from 'react';

import {
  AppSpinner,
} from '@/components/ui';

/*===========================================================
  BillLoadingState:
  => Loading state for the Bills section.
===========================================================*/
const BillLoadingState = () => {
  return (
    <div className="flex min-h-[220px] items-center justify-center">
      <div className="text-center">
        <AppSpinner
          size="lg"
          label="Loading bills"
          className="text-[var(--app-primary)]"
        />

        <p className="mt-3 text-sm text-[var(--app-text-muted)]">
          Loading bills...
        </p>
      </div>
    </div>
  );
};

export default BillLoadingState;