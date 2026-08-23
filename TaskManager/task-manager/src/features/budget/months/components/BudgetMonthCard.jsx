import React from 'react';

import {
  Link,
} from 'react-router-dom';

import {
  BudgetIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
} from '@/components/icons/Icons';

import {
  AppActionMenu,
  AppActionMenuItem,
} from '@/components/ui';

import {
  formatBudgetMonth,
  formatCurrency,
} from '@/features/budget/utils/budgetFormatters';

/*===========================================================
  BudgetMonthCard:
  => Displays one Budget Month summary card.

  Supports:
  => View Budget.
  => Edit Budget Month.
  => Delete Budget Month.

  Navigation:
  => Card body is informational only.
  => Only the footer navigates to Budget Month details.

  Interaction:
  => Card remains stationary on hover.
  => Card shadow becomes slightly stronger.
  => BudgetIcon opens the action menu.
  => Footer highlights and animates on hover.
===========================================================*/
const BudgetMonthCard = ({
  budgetMonth,
  onEdit,
  onDelete,
}) => {
  const monthLabel =
    formatBudgetMonth(
      budgetMonth.month,
      budgetMonth.year
    );

  return (
    <div
      className="
        rounded-2xl
        border
        border-[var(--app-border)]
        bg-[var(--app-surface)]
        shadow-sm

        transition-shadow
        duration-200

        hover:shadow-md
      "
    >
      {/*=======================================================
        Card Body:
        => Informational only.
        => Does not navigate.
      =======================================================*/}
      <div className="relative cursor-default p-5">
        {/*=====================================================
          Action Menu:
          => BudgetIcon acts as the trigger.
        =====================================================*/}
        <div className="absolute right-5 top-5 z-20">
          <AppActionMenu
            ariaLabel={`Actions for ${monthLabel}`}
            trigger={
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center

                  rounded-xl

                  bg-indigo-100
                  text-indigo-700

                  transition-all
                  duration-200

                  hover:scale-105
                  hover:bg-indigo-200

                  active:scale-95

                  dark:bg-indigo-500/15
                  dark:text-indigo-300
                  dark:hover:bg-indigo-500/25
                "
              >
                <BudgetIcon className="h-5 w-5" />
              </div>
            }
          >
            {/*=================================================
              Edit
            =================================================*/}
            <AppActionMenuItem
              icon={
                <PencilIcon className="h-4 w-4" />
              }
              onClick={() =>
                onEdit?.(
                  budgetMonth
                )
              }
            >
              Edit
            </AppActionMenuItem>

            {/*=================================================
              Delete
            =================================================*/}
            <AppActionMenuItem
              icon={
                <TrashIcon className="h-4 w-4" />
              }
              variant="danger"
              onClick={() =>
                onDelete?.(
                  budgetMonth
                )
              }
            >
              Delete
            </AppActionMenuItem>
          </AppActionMenu>
        </div>

        {/*=====================================================
          Header
        =====================================================*/}
        <div className="pr-16">
          <p className="text-sm font-semibold text-[var(--app-primary)]">
            Budget month
          </p>

          <h2 className="mt-1 text-xl font-bold text-[var(--app-text)]">
            {monthLabel}
          </h2>
        </div>

        {/*=====================================================
          Summary
        =====================================================*/}
        <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-5">
          {/*===================================================
            Planned Income
          ===================================================*/}
          <div>
            <p className="text-xs text-[var(--app-text-muted)]">
              Planned income
            </p>

            <p className="mt-1 text-base font-bold text-[var(--app-text)]">
              {formatCurrency(
                budgetMonth.plannedIncome
              )}
            </p>
          </div>

          {/*===================================================
            Actual Income
          ===================================================*/}
          <div>
            <p className="text-xs text-[var(--app-text-muted)]">
              Actual income
            </p>

            <p className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(
                budgetMonth.totalIncome
              )}
            </p>
          </div>

          {/*===================================================
            Expenses
          ===================================================*/}
          <div>
            <p className="text-xs text-[var(--app-text-muted)]">
              Expenses
            </p>

            <p className="mt-1 text-base font-bold text-[var(--app-text)]">
              {formatCurrency(
                budgetMonth.totalExpenses
              )}
            </p>
          </div>

          {/*===================================================
            Left To Assign
          ===================================================*/}
          <div>
            <p className="text-xs text-[var(--app-text-muted)]">
              Left to assign
            </p>

            <p className="mt-1 text-base font-bold text-[var(--app-text)]">
              {formatCurrency(
                budgetMonth.leftToAssign
              )}
            </p>
          </div>
        </div>
      </div>

      {/*=======================================================
        Footer:
        => Only this area navigates to Budget Month details.
      =======================================================*/}
      <Link
        to={`/budget/months/${budgetMonth.id}`}
        className="
          group

          flex
          items-center
          justify-between

          rounded-b-2xl

          border-t
          border-[var(--app-border)]

          px-5
          py-4

          transition-colors
          duration-200

          hover:bg-[var(--app-surface-muted)]

          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-[var(--app-primary)]/30
          focus-visible:ring-offset-2
        "
      >
        <span
          className="
            text-sm
            font-semibold
            text-[var(--app-primary)]

            transition-transform
            duration-200

            group-hover:translate-x-1
          "
        >
          View budget
        </span>

        <ChevronRightIcon
          className="
            h-5
            w-5

            text-[var(--app-text-muted)]

            transition-all
            duration-200

            group-hover:translate-x-1
            group-hover:text-[var(--app-primary)]
          "
        />
      </Link>
    </div>
  );
};

export default BudgetMonthCard;