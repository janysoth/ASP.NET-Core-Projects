import React from 'react';

import {
  ReceiptIcon,
} from '@/components/icons/Icons';

/*===========================================================
  BillEmptyState:
  => Displayed when a budget month has no bills.
===========================================================*/
const BillEmptyState = () => {
  return (
    <div className="px-5 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--app-surface-muted)]">
        <ReceiptIcon className="h-6 w-6 text-[var(--app-text-muted)]" />
      </div>

      <p className="mt-4 text-sm font-semibold text-[var(--app-text)]">
        No bills found
      </p>

      <p className="mt-1 text-sm text-[var(--app-text-muted)]">
        There are no bills in this budget month.
      </p>
    </div>
  );
};

export default BillEmptyState;