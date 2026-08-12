import React from 'react';

import {
  formatCurrency,
  formatUtcDate,
} from '../../utils/budgetFormatters';

/*===========================================================
  BillPaymentDetails:
  => Displays read-only payment information for a paid bill.
===========================================================*/
const BillPaymentDetails = ({
  bill,
}) => {
  return (
    <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)]/60 p-4">
      <h3 className="text-sm font-semibold text-[var(--app-text)]">
        Payment details
      </h3>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-[var(--app-text-muted)]">
            Status
          </dt>

          <dd className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            Paid
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-[var(--app-text-muted)]">
            Paid date
          </dt>

          <dd className="mt-1 text-sm font-semibold text-[var(--app-text)]">
            {formatUtcDate(
              bill?.paidDate,
              'Not available'
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-[var(--app-text-muted)]">
            Expected amount
          </dt>

          <dd className="mt-1 text-sm font-semibold text-[var(--app-text)]">
            {formatCurrency(
              bill?.expectedAmount
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-[var(--app-text-muted)]">
            Actual amount
          </dt>

          <dd className="mt-1 text-sm font-semibold text-[var(--app-text)]">
            {bill?.actualAmount != null
              ? formatCurrency(
                bill.actualAmount
              )
              : 'Not available'}
          </dd>
        </div>

        <div className="sm:col-span-2">
          <dt className="text-xs font-medium text-[var(--app-text-muted)]">
            Payment account
          </dt>

          <dd className="mt-1 text-sm font-semibold text-[var(--app-text)]">
            {bill?.accountName ||
              'Unknown account'}
          </dd>
        </div>
      </dl>
    </div>
  );
};

export default BillPaymentDetails;