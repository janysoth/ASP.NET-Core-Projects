import React, {
  useMemo,
} from 'react';

import {
  ArrowDownIcon,
  PlusIcon,
} from '@/components/icons/Icons';

import {
  AppButton,
} from '@/components/ui';

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

  Supports:
  => Add Income action in the section header.
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
    handleAddIncome:
    => Placeholder for the create-income workflow.
    => We will replace this with the actual modal next.
  ===========================================================*/
  const handleAddIncome = () => {
    console.log(
      'Add income'
    );
  };

  /*===========================================================
    Section Actions
  ===========================================================*/
  const sectionActions = (
    <>
      <AppButton
        variant="primary"
        onClick={
          handleAddIncome
        }
      >
        <PlusIcon className="h-4 w-4" />

        <span>
          Add income
        </span>
      </AppButton>

      <div className="hidden rounded-xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 sm:block">
        <ArrowDownIcon className="h-5 w-5" />
      </div>
    </>
  );

  return (
    <FinancialSection
      title="Income"
      subtitle={`Income assigned to ${monthLabel}`}
      actions={
        sectionActions
      }
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