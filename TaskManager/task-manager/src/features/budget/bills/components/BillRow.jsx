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
  FinancialTableRow,
} from '@/features/budget/components';

import {
  formatCurrency,
  formatUtcDate,
} from '@/features/budget/utils/budgetFormatters';

import {
  getBillStatusAppearance,
} from '@/features/budget/utils/billUtils';

/*===========================================================
  BillRow:
  => Displays one bill using the shared financial layout.

  Layout:
  => Description | Amount | Remaining

  Desktop / tablet:
  => Description uses remaining width.
  => Amount and Remaining use fixed financial columns.
  => Main values stay aligned at the top.
  => Actions appear underneath Remaining.

  Interaction:
  => Clicking bill information opens edit/details.
  => Unpaid actions appear after a short delay when the
     row is hovered or keyboard-focused.
  => Individual ActionButton labels expand on button hover.
  => Paid bills do not display payment/delete actions.
===========================================================*/
const BillRow = ({
  bill,
  columns = [],
  onOpen,
  onMarkPaid,
  onDelete,
}) => {
  const statusAppearance =
    getBillStatusAppearance(
      bill
    );

  const remainingAmount =
    Number(
      bill.remainingAmount ??
      bill.expectedAmount ??
      0
    );

  return (
    <div
      className="
        group/row
        transition-colors
        duration-200

        hover:bg-[var(--app-surface-muted)]
        focus-within:bg-[var(--app-surface-muted)]
      "
    >
      <FinancialTableRow
        columns={
          columns
        }
        align="start"
      >
        {/*===================================================
          Description Column
        ===================================================*/}
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
            w-full
            items-center
            gap-4

            text-left

            focus-visible:outline-none
          "
        >
          {/*=================================================
            Bill Icon
          =================================================*/}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            <CalendarIcon className="h-5 w-5" />
          </div>

          {/*=================================================
            Bill Information
          =================================================*/}
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <p className="min-w-0 truncate text-sm font-semibold text-[var(--app-text)]">
                {bill.name}
              </p>

              <span
                className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${statusAppearance.className}`}
              >
                {statusAppearance.label}
              </span>
            </div>

            <p className="mt-1 truncate text-xs text-[var(--app-text-muted)]">
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

        {/*===================================================
          Amount Column
        ===================================================*/}
        <div className="w-full text-left md:text-right">
          <p className="text-xs text-[var(--app-text-muted)] md:hidden">
            Amount
          </p>

          <p className="mt-1 text-sm font-bold text-[var(--app-text)] md:mt-0">
            {formatCurrency(
              bill.expectedAmount
            )}
          </p>
        </div>

        {/*===================================================
          Remaining / Payment / Actions Column
        ===================================================*/}
        <div className="w-full min-w-0 text-left md:text-right">
          {/*=================================================
            Mobile Label
          =================================================*/}
          <p className="text-xs text-[var(--app-text-muted)] md:hidden">
            {bill.isPaid
              ? 'Payment'
              : 'Remaining'}
          </p>

          {/*=================================================
            Unpaid Bill
          =================================================*/}
          {!bill.isPaid && (
            <>
              {/*=============================================
                Remaining Amount
              =============================================*/}
              <p className="mt-1 text-sm font-bold text-[var(--app-text)] md:mt-0">
                {formatCurrency(
                  remainingAmount
                )}
              </p>

              {/*=============================================
                Actions

                Mobile:
                => Always visible.

                Desktop / tablet:
                => Hidden normally.
                => Waits briefly after row hover.
                => Fades and rises gently into place.
                => Individual ActionButton handles its own
                   expandable-label animation.
              =============================================*/}
              <div
                className="
                  mt-3

                  flex
                  items-center
                  gap-2

                  md:justify-end

                  transition-all
                  delay-200
                  duration-300
                  ease-in-out

                  md:pointer-events-none
                  md:max-h-0
                  md:overflow-hidden
                  md:translate-y-1
                  md:opacity-0

                  md:group-hover/row:pointer-events-auto
                  md:group-hover/row:max-h-12
                  md:group-hover/row:overflow-visible
                  md:group-hover/row:translate-y-0
                  md:group-hover/row:opacity-100

                  md:group-focus-within/row:pointer-events-auto
                  md:group-focus-within/row:max-h-12
                  md:group-focus-within/row:overflow-visible
                  md:group-focus-within/row:translate-y-0
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
            </>
          )}

          {/*=================================================
            Paid Bill
          =================================================*/}
          {bill.isPaid && (
            <div>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Paid
              </p>

              {bill.paidDate && (
                <p className="mt-1 text-xs text-[var(--app-text-muted)]">
                  {formatUtcDate(
                    bill.paidDate
                  )}
                </p>
              )}
            </div>
          )}
        </div>
      </FinancialTableRow>
    </div>
  );
};

export default BillRow;