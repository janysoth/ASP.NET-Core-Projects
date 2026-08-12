import React from 'react';

import {
  ActionButton,
} from '@/components/ui';

import {
  CalendarIcon,
  TrashIcon,
  WalletIcon,
} from '@/components/icons/Icons';

import {
  formatCurrency,
  formatUtcDate,
} from '@/features/budget/utils/budgetFormatters';

import {
  getBillStatusAppearance,
} from '@/features/budget/utils/billUtils';

/*===========================================================
  BillRow:
  => Displays one bill row.

  Handles:
  => Bill information.
  => Paid / unpaid status.
  => Amount display.
  => Hover actions.
  => Opening bill details/edit.
  => Mark Paid action.
  => Delete action.

  IMPORTANT:
  => Business logic stays in parent hooks.
  => This component only handles presentation and events.
===========================================================*/
const BillRow = ({
  bill,
  onOpen,
  onMarkPaid,
  onDelete,
}) => {
  const statusAppearance =
    getBillStatusAppearance(
      bill
    );

  return (
    <div
      className="
        group/row
        flex
        w-full
        items-stretch
        transition-all
        duration-200

        hover:bg-[var(--app-surface-muted)]
        focus-within:bg-[var(--app-surface-muted)]
      "
    >
      {/*=====================================================
        Main bill information
      =====================================================*/}
      <button
        type="button"
        onClick={() =>
          onOpen?.(
            bill
          )
        }
        className="
          flex
          min-w-0
          flex-1
          items-center
          gap-4

          px-5
          py-4

          text-left

          focus-visible:outline-none
        "
      >
        {/*===================================================
          Bill icon
        ===================================================*/}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          <CalendarIcon className="h-5 w-5" />
        </div>

        {/*===================================================
          Bill information
        ===================================================*/}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className="
                min-w-0
                text-sm
                font-semibold
                text-[var(--app-text)]

                max-sm:truncate
              "
            >
              {bill.name}
            </p>

            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusAppearance.className}`}
            >
              {statusAppearance.label}
            </span>
          </div>

          <p
            className="
              mt-1
              text-xs
              leading-5
              text-[var(--app-text-muted)]

              max-sm:truncate
            "
          >
            {bill.budgetCategoryName ||
              'Unknown category'}

            {' · '}

            Due{' '}

            {formatUtcDate(
              bill.dueDate,
              'No due date'
            )}
          </p>
        </div>
      </button>

      {/*=====================================================
        Right side
      =====================================================*/}
      <div
        className="
          ml-auto
          flex
          min-w-[185px]
          shrink-0
          flex-col
          items-end
          justify-center

          py-4
          pr-5
          pl-3
        "
      >
        {/*===================================================
          Amount / payment information
        ===================================================*/}
        <div className="text-right">
          <p className="text-sm font-bold text-[var(--app-text)]">
            {formatCurrency(
              bill.expectedAmount
            )}
          </p>

          {!bill.isPaid && (
            <p className="mt-1 whitespace-nowrap text-xs text-[var(--app-text-muted)]">
              {formatCurrency(
                bill.remainingAmount ??
                bill.expectedAmount
              )}{' '}
              remaining
            </p>
          )}

          {bill.isPaid && (
            <p className="mt-1 whitespace-nowrap text-xs text-emerald-600 dark:text-emerald-400">
              Paid{' '}

              {bill.paidDate
                ? formatUtcDate(
                  bill.paidDate
                )
                : ''}
            </p>
          )}
        </div>

        {/*===================================================
          Unpaid bill actions
        ===================================================*/}
        {!bill.isPaid && (
          <div
            className="
              mt-2
              flex
              max-h-0
              items-center
              gap-2
              overflow-hidden
              opacity-0

              transition-all
              duration-200
              ease-out

              md:group-hover/row:max-h-12
              md:group-hover/row:opacity-100

              md:group-focus-within/row:max-h-12
              md:group-focus-within/row:opacity-100
            "
          >
            <ActionButton
              variant="success"
              size="sm"
              expandable
              label="Mark Paid"
              icon={
                <WalletIcon className="h-4 w-4" />
              }
              onClick={(event) => {
                event.stopPropagation();

                onMarkPaid?.(
                  bill
                );
              }}
            />

            <ActionButton
              variant="danger"
              size="sm"
              expandable
              label="Delete"
              icon={
                <TrashIcon className="h-4 w-4" />
              }
              onClick={(event) => {
                event.stopPropagation();

                onDelete?.(
                  bill
                );
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BillRow;