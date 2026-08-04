import React from 'react';

import {
  ArrowDownIcon,
  ArrowUpIcon,
  BudgetIcon,
  WalletIcon,
} from '../../../../components/icons/Icons';

import SummaryCard from '../../dashboard/components/SummaryCard';

import {
  formatCurrency,
} from '../../utils/budgetFormatters';

/*===========================================================
  BudgetMonthSummary:
  => Displays the four primary monthly budget summary cards.
===========================================================*/
const BudgetMonthSummary = ({
  budgetMonth,
  monthLabel,
}) => {
  return (
    <section className="app-section-gap grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        title="Planned income"
        value={formatCurrency(
          budgetMonth?.plannedIncome
        )}
        helperText={`Expected income for ${monthLabel}`}
        icon={BudgetIcon}
        tone="primary"
      />

      <SummaryCard
        title="Actual income"
        value={formatCurrency(
          budgetMonth?.totalIncome
        )}
        helperText="Income recorded in this budget month"
        icon={ArrowDownIcon}
        tone="positive"
      />

      <SummaryCard
        title="Total expenses"
        value={formatCurrency(
          budgetMonth?.totalExpenses
        )}
        helperText="Fixed and variable expenses"
        icon={ArrowUpIcon}
        tone="danger"
      />

      <SummaryCard
        title="Left to assign"
        value={formatCurrency(
          budgetMonth?.leftToAssign
        )}
        helperText="Planned income not yet assigned"
        icon={WalletIcon}
        tone="warning"
      />
    </section>
  );
};

export default BudgetMonthSummary;