import React, {
  useMemo,
} from 'react';

import {
  ArrowDownIcon,
} from '@/components/icons/Icons';

import {
  FinancialRows,
  FinancialSection,
} from '@/features/budget/components';

import {
  createFinancialColumns,
} from '@/features/budget/utils/layout';

import {
  IncomeEmptyState,
  IncomeRow,
} from './components';

/*===========================================================
  BudgetIncomeSection:
  => Displays income records for one budget month.

  Uses:
  => FinancialSection for shared card/header layout.
  => FinancialRows for shared row rendering.
  => FinancialTableRow through IncomeRow.

  Layout:
  => Income | Amount | Date
===========================================================*/
const BudgetIncomeSection = ({
  incomeRecords = [],
  monthLabel,
}) => {
  /*===========================================================
    Financial Table Columns
  ===========================================================*/
  const tableColumns =
    useMemo(
      () =>
        createFinancialColumns([
          {
            key: 'income',
            label: 'Income',
          },
          {
            key: 'amount',
            label: 'Amount',
          },
          {
            key: 'date',
            label: 'Date',
          },
        ]),
      []
    );

  /*===========================================================
    Section Icon
  ===========================================================*/
  const sectionIcon = (
    <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
      <ArrowDownIcon className="h-5 w-5" />
    </div>
  );

  return (
    <FinancialSection
      title="Income"
      subtitle={`Income assigned to ${monthLabel}`}
      icon={sectionIcon}
      columns={
        incomeRecords.length > 0
          ? tableColumns
          : []
      }
    >
      <FinancialRows
        items={
          incomeRecords
        }
        emptyState={
          <IncomeEmptyState />
        }
        renderRow={(
          income
        ) => (
          <IncomeRow
            key={
              income.id
            }
            income={
              income
            }
            columns={
              tableColumns
            }
          />
        )}
      />
    </FinancialSection>
  );
};

export default BudgetIncomeSection;