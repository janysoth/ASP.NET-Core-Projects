import React from 'react';

import {
  ActionButton,
} from '@/components/ui';

import {
  ArrowDownIcon,
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
  IncomeRow:
  => Displays one income record using the shared
     FinancialTableRow layout.

  Layout:
  => Income | Amount | Date

  Interaction:
  => Edit and Delete actions appear underneath Date
     on row hover/focus.
  => Individual ActionButton labels expand on button hover.
===========================================================*/
const IncomeRow = ({
  income,
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
          Income Column
        ===================================================*/}
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            <ArrowDownIcon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--app-text)]">
              {income.source}
            </p>

            <p className="mt-1 truncate text-xs text-[var(--app-text-muted)]">
              {income.accountName ||
                'Unknown account'}
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

          <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400 md:mt-0">
            {formatCurrency(
              income.amount
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
              income.incomeDate
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
                  income
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
                  income
                );
              }}
            />
          </div>
        </div>
      </FinancialTableRow>
    </div>
  );
};

export default IncomeRow;