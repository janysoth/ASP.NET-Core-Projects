import React, {
  useMemo,
} from 'react';

/*===========================================================
  formatCurrency:
  => Formats currency values for display.
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
  TransferSummary:
  => Displays summary information for Transfers.

  Shows:
  => Transfer count.
  => Total amount moved.

  IMPORTANT:
  => Total amount represents money moved between accounts.
  => It is NOT income or expense.
===========================================================*/
const TransferSummary = ({
  transfers = [],
}) => {
  /*===========================================================
    Total Transfer Amount
  ===========================================================*/
  const totalTransferred =
    useMemo(
      () =>
        transfers.reduce(
          (
            total,
            transfer
          ) => {
            const amount =
              Number(
                transfer?.amount
              );

            return (
              total +
              (
                Number.isNaN(
                  amount
                )
                  ? 0
                  : amount
              )
            );
          },
          0
        ),
      [
        transfers,
      ]
    );

  return (
    <div
      className="
        grid
        gap-3

        border-t
        border-[var(--app-border)]

        bg-[var(--app-surface-muted)]/40

        px-4
        py-4

        sm:grid-cols-2
      "
    >
      {/*=======================================================
        Transfer Count
      =======================================================*/}
      <div
        className="
          rounded-xl
          border
          border-[var(--app-border)]

          bg-[var(--app-surface)]

          px-4
          py-3
        "
      >
        <p
          className="
            text-xs
            font-semibold
            uppercase
            tracking-wide
            text-[var(--app-text-muted)]
          "
        >
          Transfers
        </p>

        <p
          className="
            mt-1

            text-lg
            font-bold
            text-[var(--app-text)]
          "
        >
          {transfers.length}
        </p>
      </div>

      {/*=======================================================
        Total Amount Moved
      =======================================================*/}
      <div
        className="
          rounded-xl
          border
          border-[var(--app-border)]

          bg-[var(--app-surface)]

          px-4
          py-3
        "
      >
        <p
          className="
            text-xs
            font-semibold
            uppercase
            tracking-wide
            text-[var(--app-text-muted)]
          "
        >
          Total moved
        </p>

        <p
          className="
            mt-1

            text-lg
            font-bold
            text-[var(--app-text)]
          "
        >
          {formatCurrency(
            totalTransferred
          )}
        </p>
      </div>
    </div>
  );
};

export default TransferSummary;