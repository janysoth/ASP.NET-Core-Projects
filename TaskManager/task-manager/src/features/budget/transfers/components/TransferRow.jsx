import React, {
  useMemo,
} from 'react';

import {
  PencilIcon,
  TransactionIcon,
  TrashIcon,
} from '@/components/icons/Icons';

/*===========================================================
  formatCurrency:
  => Formats money for display.

  Example:
  => 1250
  => $1,250.00
===========================================================*/
const formatCurrency = (
  value
) => {
  const amount =
    Number(
      value
    );

  if (
    Number.isNaN(
      amount
    )
  ) {
    return '$0.00';
  }

  return new Intl.NumberFormat(
    'en-US',
    {
      style: 'currency',
      currency: 'USD',
    }
  ).format(
    amount
  );
};

/*===========================================================
  formatTransferDate:
  => Converts API date into readable display.

  Example:
  => 2026-09-15T00:00:00Z
  => Sep 15, 2026
===========================================================*/
const formatTransferDate = (
  value
) => {
  if (!value) {
    return '—';
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—';
  }

  return date.toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }
  );
};

/*===========================================================
  TransferRow:
  => Displays one account transfer.

  Shows:
  => From Account.
  => To Account.
  => Amount.
  => Transfer Date.
  => Optional Notes.
  => Edit action.
  => Delete action.

  IMPORTANT:
  => Account names are resolved from the Accounts collection.
===========================================================*/
const TransferRow = ({
  transfer,

  accounts = [],

  onEdit,
  onDelete,
}) => {
  /*===========================================================
    Account Lookup
  ===========================================================*/
  const {
    fromAccountName,
    toAccountName,
  } = useMemo(
    () => {
      const fromAccount =
        accounts.find(
          (
            account
          ) =>
            account.id ===
            transfer?.fromAccountId
        );

      const toAccount =
        accounts.find(
          (
            account
          ) =>
            account.id ===
            transfer?.toAccountId
        );

      return {
        fromAccountName:
          transfer?.fromAccountName ??
          fromAccount?.name ??
          'Unknown account',

        toAccountName:
          transfer?.toAccountName ??
          toAccount?.name ??
          'Unknown account',
      };
    },
    [
      accounts,
      transfer?.fromAccountId,
      transfer?.fromAccountName,
      transfer?.toAccountId,
      transfer?.toAccountName,
    ]
  );

  if (!transfer) {
    return null;
  }

  return (
    <div
      className="
        border-b
        border-[var(--app-border)]

        px-4
        py-4

        last:border-b-0

        transition-colors
        hover:bg-[var(--app-surface-muted)]/50
      "
    >
      <div
        className="
          flex
          flex-col
          gap-4

          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        {/*=====================================================
          Transfer Information
        =====================================================*/}
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center

              rounded-xl

              bg-[var(--app-primary)]/10
              text-[var(--app-primary)]
            "
          >
            <TransactionIcon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div
              className="
                flex
                flex-wrap
                items-center
                gap-1.5

                text-sm
                font-semibold
                text-[var(--app-text)]
              "
            >
              <span className="truncate">
                {fromAccountName}
              </span>

              <span className="text-[var(--app-text-muted)]">
                →
              </span>

              <span className="truncate">
                {toAccountName}
              </span>
            </div>

            {transfer.notes && (
              <p
                className="
                  mt-1
                  line-clamp-2

                  text-xs
                  text-[var(--app-text-muted)]
                "
              >
                {transfer.notes}
              </p>
            )}
          </div>
        </div>

        {/*=====================================================
          Amount / Date / Actions
        =====================================================*/}
        <div
          className="
            flex
            items-center
            justify-between
            gap-4

            sm:justify-end
          "
        >
          <div className="text-right">
            <p
              className="
                text-sm
                font-bold
                text-[var(--app-text)]
              "
            >
              {formatCurrency(
                transfer.amount
              )}
            </p>

            <p
              className="
                mt-1
                whitespace-nowrap

                text-xs
                text-[var(--app-text-muted)]
              "
            >
              {formatTransferDate(
                transfer.transferDate
              )}
            </p>
          </div>

          {/*===================================================
            Actions
          ===================================================*/}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                onEdit?.(
                  transfer
                )
              }
              aria-label="Edit transfer"
              title="Edit transfer"
              className="
                flex
                h-9
                w-9
                items-center
                justify-center

                rounded-xl

                text-[var(--app-text-muted)]

                transition-all
                duration-200

                hover:bg-[var(--app-primary)]/10
                hover:text-[var(--app-primary)]

                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[var(--app-primary)]/20
              "
            >
              <PencilIcon className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() =>
                onDelete?.(
                  transfer
                )
              }
              aria-label="Delete transfer"
              title="Delete transfer"
              className="
                flex
                h-9
                w-9
                items-center
                justify-center

                rounded-xl

                text-[var(--app-text-muted)]

                transition-all
                duration-200

                hover:bg-red-50
                hover:text-red-600

                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-red-500/20

                dark:hover:bg-red-500/10
                dark:hover:text-red-400
              "
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferRow;