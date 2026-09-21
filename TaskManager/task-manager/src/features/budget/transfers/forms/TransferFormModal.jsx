import React from 'react';

import {
  AppModal,
  ModalHeader,
} from '@/components/ui';

import TransferForm from './TransferForm';

/*===========================================================
  TransferFormModal:
  => Wraps TransferForm inside the shared AppModal.

  Supports:
  => Create Transfer.
  => Edit Transfer.

  IMPORTANT:
  => Does NOT call the API directly.
  => Parent workflow owns submission.
===========================================================*/
const TransferFormModal = ({
  mode = 'create',

  transfer = null,

  isOpen,

  onClose,
  onSubmit,

  accounts = [],

  monthLabel = '',

  submitting = false,
}) => {
  /*===========================================================
    Edit Mode
  ===========================================================*/
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
      ariaLabelledBy="transfer-form-title"
      ariaDescribedBy="transfer-form-description"
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
            ? 'Edit transfer'
            : 'Create transfer'
        }
        description={
          isEditing
            ? 'Update the details for this account transfer.'
            : 'Move money between your financial accounts.'
        }
        titleId="transfer-form-title"
        descriptionId="transfer-form-description"
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
        <TransferForm
          mode={
            mode
          }
          transfer={
            transfer
          }
          accounts={
            accounts
          }
          monthLabel={
            monthLabel
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

export default TransferFormModal;