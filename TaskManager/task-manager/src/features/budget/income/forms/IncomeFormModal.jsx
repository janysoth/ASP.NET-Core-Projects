import React from 'react';

import {
  AppModal,
  ModalHeader,
} from '@/components/ui';

import IncomeForm from './IncomeForm';

/*===========================================================
  IncomeFormModal:
  => Wraps IncomeForm inside the shared AppModal.

  Supports:
  => Create income.
  => Edit income.

  IMPORTANT:
  => Does not call the API directly.
  => Parent hook controls submission.
===========================================================*/
const IncomeFormModal = ({
  mode = 'create',
  income = null,

  isOpen,
  onClose,
  onSubmit,

  accounts = [],
  accountsLoading = false,
  accountsError = '',

  submitting = false,

  monthLabel,
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
      ariaLabelledBy="income-form-title"
      ariaDescribedBy="income-form-description"
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
            ? 'Edit income'
            : 'Add income'
        }
        description={
          isEditing
            ? 'Update the details for this income record.'
            : 'Record income received during this budget month.'
        }
        titleId="income-form-title"
        descriptionId="income-form-description"
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
        <IncomeForm
          mode={
            mode
          }
          income={
            income
          }
          accounts={
            accounts
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

export default IncomeFormModal;