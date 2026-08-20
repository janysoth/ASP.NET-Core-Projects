import React from 'react';

import {
  AppModal,
  ModalHeader,
} from '@/components/ui';

import ExpenseForm from './ExpenseForm';

/*===========================================================
  ExpenseFormModal:
  => Wraps ExpenseForm inside the shared AppModal.

  Supports:
  => Create expense.
  => Edit expense.

  IMPORTANT:
  => CategoryQuickCreateModal is owned by
     BudgetExpenseSection, not this modal.
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
  const isEditing =
    mode === 'edit';

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