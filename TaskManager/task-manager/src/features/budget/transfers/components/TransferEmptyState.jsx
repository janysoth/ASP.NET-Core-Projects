import React from 'react';

import {
  TransactionIcon,
} from '@/components/icons/Icons';

/*===========================================================
  TransferEmptyState:
  => Displayed when the selected Budget Month has no
     account transfers.

  IMPORTANT:
  => Does NOT own any actions.
  => BudgetTransferSection owns the Create Transfer button.
===========================================================*/
const TransferEmptyState = () => {
  return (
    <div
      className="
        flex
        min-h-[180px]
        flex-col
        items-center
        justify-center

        px-6
        py-10

        text-center
      "
    >
      {/*=======================================================
        Icon
      =======================================================*/}
      <div
        className="
          flex
          h-12
          w-12
          items-center
          justify-center

          rounded-2xl

          bg-[var(--app-primary)]/10

          text-[var(--app-primary)]
        "
      >
        <TransactionIcon className="h-6 w-6" />
      </div>

      {/*=======================================================
        Title
      =======================================================*/}
      <h3
        className="
          mt-4

          text-base
          font-semibold
          text-[var(--app-text)]
        "
      >
        No transfers yet
      </h3>

      {/*=======================================================
        Description
      =======================================================*/}
      <p
        className="
          mt-2
          max-w-sm

          text-sm
          leading-6
          text-[var(--app-text-muted)]
        "
      >
        Transfers between your financial accounts will appear here.
      </p>
    </div>
  );
};

export default TransferEmptyState;