import React, {
  useMemo,
} from 'react';

import {
  ArrowUpIcon,
} from '@/components/icons/Icons';

import {
  FinancialRows,
  FinancialSection,
} from '@/features/budget/components';

import {
  createFinancialColumns,
} from '@/features/budget/utils/layout';

import {
  ExpenseEmptyState,
  ExpenseRow,
} from './components';

/*===========================================================
  BudgetExpenseSection:
  => Displays expense records for one budget month.

  Uses:
  => FinancialSection for shared card/header layout.
  => FinancialRows for shared row rendering.
  => FinancialTableRow through ExpenseRow.

  Layout:
  => Expense | Amount | Date
===========================================================*/
const BudgetExpenseSection = ({
  expenseRecords = [],
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
            key: 'expense',
            label: 'Expense',
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
    <div className="rounded-xl bg-red-100 p-2.5 text-red-700 dark:bg-red-500/15 dark:text-red-300">
      <ArrowUpIcon className="h-5 w-5" />
    </div>
  );

  return (
    <FinancialSection
      title="Expenses"
      subtitle={`Expense activity recorded in ${monthLabel}`}
      icon={sectionIcon}
      columns={
        expenseRecords.length > 0
          ? tableColumns
          : []
      }
    >
      <FinancialRows
        items={
          expenseRecords
        }
        emptyState={
          <ExpenseEmptyState />
        }
        renderRow={(
          expense
        ) => (
          <ExpenseRow
            key={
              expense.id
            }
            expense={
              expense
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

export default BudgetExpenseSection;