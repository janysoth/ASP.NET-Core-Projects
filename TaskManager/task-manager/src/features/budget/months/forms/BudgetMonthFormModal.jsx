import React from 'react';

import {
  AppModal,
  ModalHeader,
} from '@/components/ui';

import BudgetMonthForm from './BudgetMonthForm';

/*===========================================================
  BudgetMonthFormModal:
  => Wraps BudgetMonthForm inside the shared AppModal.

  Supports:
  => Create budget month.
  => Edit budget month.

  IMPORTANT:
  => Does not call the API directly.
  => Parent hook controls submission.
===========================================================*/
const BudgetMonthFormModal = ({
  mode = 'create',
  budgetMonth = null,

  isOpen,
  onClose,
  onSubmit,

  existingBudgetMonths = [],

  submitting = false,
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
      ariaLabelledBy="budget-month-form-title"
      ariaDescribedBy="budget-month-form-description"
    >
      {/*=======================================================
        Header
      =======================================================*/}
      <ModalHeader
        title={
          isEditing
            ? 'Edit budget month'
            : 'Create budget month'
        }
        description={
          isEditing
            ? 'Update the planned income for this budget month.'
            : 'Create a monthly budget plan and set your expected income.'
        }
        titleId="budget-month-form-title"
        descriptionId="budget-month-form-description"
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
        <BudgetMonthForm
          mode={
            mode
          }
          budgetMonth={
            budgetMonth
          }
          existingBudgetMonths={
            existingBudgetMonths
          }
          onSubmit={
            onSubmit
          }
          onCancel={
            onClose
          }
          submitting={
            submitting
          }
        />
      </div>
    </AppModal>
  );
};

export default BudgetMonthFormModal;