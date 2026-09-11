import React, {
  useMemo,
} from 'react';

import {
  AppModal,
  ModalHeader,
} from '@/components/ui';

import {
  getBudgetMonthDateRangeFromLabel,
} from '@/features/budget/utils/budgetDateUtils';

import ExpenseForm from './ExpenseForm';

/*===========================================================
  ExpenseFormModal:
  => Wraps ExpenseForm inside the shared AppModal.

  Supports:
  => Create Expense.
  => Edit Expense.
  => Budget Month date restrictions.

  IMPORTANT:
  => CategoryQuickCreateModal remains owned by
     BudgetExpenseSection.
===========================================================*/
const ExpenseFormModal = ({
  mode = 'create',

  expense = null,

  isOpen,
  onClose,
  onSubmit,

  accounts = [],
  categories = [],

  createdCategoryId = '',

  accountsLoading = false,
  accountsError = '',

  submitting = false,

  monthLabel,

  onCreateCategory,
}) => {
  /*===========================================================
    Edit Mode
  ===========================================================*/
  const isEditing =
    mode === 'edit';

  /*===========================================================
    Budget Month Date Range
  ===========================================================*/
  const {
    minDate,
    maxDate,
  } = useMemo(
    () =>
      getBudgetMonthDateRangeFromLabel(
        monthLabel
      ),
    [
      monthLabel,
    ]
  );

  return (
    <AppModal
      isOpen={
        isOpen
      }
      onClose={
        onClose
      }
      maxWidth="max-w-lg"
      actionInProgress={
        submitting
      }
      ariaLabelledBy="expense-form-title"
      ariaDescribedBy="expense-form-description"
    >
      {/*=======================================================
        Header
      =======================================================*/}
      <ModalHeader
        eyebrow={
          monthLabel
        }
        title={
          isEditing
            ? 'Edit expense'
            : 'Add expense'
        }
        description={
          isEditing
            ? 'Update the details for this expense record.'
            : 'Record an expense for this budget month.'
        }
        titleId="expense-form-title"
        descriptionId="expense-form-description"
        onClose={
          onClose
        }
        closeDisabled={
          submitting
        }
      />

      {/*=======================================================
        Form
      =======================================================*/}
      <div className="px-5 py-5">
        <ExpenseForm
          mode={
            mode
          }
          expense={
            expense
          }
          accounts={
            accounts
          }
          categories={
            categories
          }
          createdCategoryId={
            createdCategoryId
          }
          accountsLoading={
            accountsLoading
          }
          accountsError={
            accountsError
          }
          submitting={
            submitting
          }
          minDate={
            minDate
          }
          maxDate={
            maxDate
          }
          onCreateCategory={
            onCreateCategory
          }
          onSubmit={
            onSubmit
          }
          onCancel={
            onClose
          }
        />
      </div>
    </AppModal>
  );
};

export default ExpenseFormModal;