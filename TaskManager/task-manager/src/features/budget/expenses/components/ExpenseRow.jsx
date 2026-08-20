import React from 'react';

import {
  ActionButton,
} from '@/components/ui';

import {
  ArrowUpIcon,
  PencilIcon,
  TrashIcon,
} from '@/components/icons/Icons';

import {
  FinancialTableRow,
} from '@/features/budget/components';

import {
  formatCurrency,
  formatUtcDate,
} from '@/features/budget/utils/budgetFormatters';

/*===========================================================
  ExpenseRow:
  => Displays one expense record using the shared
     FinancialTableRow layout.

  Layout:
  => Expense | Amount | Date

  Interaction:
  => Edit and Delete actions appear underneath Date
     on row hover/focus.
  => Individual ActionButton labels expand on button hover.
===========================================================*/
const ExpenseRow = ({
  expense,
  columns = [],
  onEdit,
  onDelete,
}) => {
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
          Expense Column
        ===================================================*/}
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">
            <ArrowUpIcon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--app-text)]">
              {expense.name}
            </p>

            <p className="mt-1 truncate text-xs text-[var(--app-text-muted)]">
              {expense.categoryName ||
                'Unknown category'}

              {expense.accountName
                ? ` · ${expense.accountName}`
                : ''}
            </p>
          </div>
        </div>

        {/*===================================================
          Amount Column
        ===================================================*/}
        <div className="w-full text-left md:text-right">
          <p className="text-xs text-[var(--app-text-muted)] md:hidden">
            Amount
          </p>

          <p className="mt-1 text-sm font-bold text-red-600 dark:text-red-400 md:mt-0">
            {formatCurrency(
              expense.amount
            )}
          </p>
        </div>

        {/*===================================================
          Date / Actions Column
        ===================================================*/}
        <div className="w-full min-w-0 text-left md:text-right">
          <p className="text-xs text-[var(--app-text-muted)] md:hidden">
            Date
          </p>

          <p className="mt-1 text-sm font-medium text-[var(--app-text)] md:mt-0">
            {formatUtcDate(
              expense.expenseDate
            )}
          </p>

          {/*=================================================
            Actions

            Mobile:
            => Always visible.

            Desktop / tablet:
            => Hidden normally.
            => Appears underneath Date after a short delay.
          =================================================*/}
          <div
            className="
              mt-3

              flex
              items-center
              gap-2

              md:justify-end

              transition-all
              delay-100
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
              variant="primary"
              size="sm"
              expandable
              label="Edit"
              icon={
                <PencilIcon className="h-4 w-4" />
              }
              onClick={(event) => {
                event.stopPropagation();

                onEdit?.(
                  expense
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
                  expense
                );
              }}
            />
          </div>
        </div>
      </FinancialTableRow>
    </div>
  );
};

export default ExpenseRow;