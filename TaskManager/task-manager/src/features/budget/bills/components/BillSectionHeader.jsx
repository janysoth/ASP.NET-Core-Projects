import React from 'react';

import {
  PlusIcon,
  ReceiptIcon,
} from '@/components/icons/Icons';

import {
  AppButton,
} from '@/components/ui';

/*===========================================================
  BillSectionHeader:
  => Displays the Bills section heading and Add Bill action.
===========================================================*/
const BillSectionHeader = ({
  monthLabel,
  onAddBill,
}) => {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--app-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-semibold text-[var(--app-text)]">
          Bills
        </h2>

        <p className="mt-1 text-sm text-[var(--app-text-muted)]">
          Fixed expense obligations for {monthLabel}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <AppButton
          variant="primary"
          onClick={onAddBill}
          className="gap-2"
        >
          <PlusIcon className="h-4 w-4" />

          Add bill
        </AppButton>

        <div className="hidden rounded-xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 sm:block">
          <ReceiptIcon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

export default BillSectionHeader;