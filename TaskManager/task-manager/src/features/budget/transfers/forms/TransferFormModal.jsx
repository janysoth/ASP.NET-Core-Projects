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
  => Creating an account transfer.

  IMPORTANT:
  => Does NOT call the API directly.
  => Parent workflow owns submission.
===========================================================*/
const TransferFormModal = ({
  isOpen,

  onClose,
  onSubmit,

  accounts = [],

  monthLabel = '',

  submitting = false,
}) => {
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
        title="Create transfer"
        description="Move money between your financial accounts."
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