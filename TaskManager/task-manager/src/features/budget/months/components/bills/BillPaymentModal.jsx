import React from 'react';

import {
  AppModal,
  ModalHeader,
} from '@/components/ui';

import BillPaymentForm from './BillPaymentForm';

/*===========================================================
  BillPaymentModal:
  => Opens the payment workflow for an unpaid bill.
  => Uses shared AppModal and ModalHeader.
  => Delegates form state and validation to BillPaymentForm.
===========================================================*/
const BillPaymentModal = ({
  isOpen,
  onClose,
  onSubmit,
  bill,
  accounts = [],
  submitting = false,
}) => {
  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      actionInProgress={submitting}
      ariaLabelledBy="bill-payment-title"
      ariaDescribedBy="bill-payment-description"
    >
      <ModalHeader
        eyebrow={
          bill?.budgetCategoryName ||
          'Bill payment'
        }
        title="Mark bill paid"
        description="Record the actual payment amount, date, and account used."
        titleId="bill-payment-title"
        descriptionId="bill-payment-description"
        onClose={onClose}
        closeDisabled={submitting}
      />

      <div className="px-5 py-5">
        <BillPaymentForm
          bill={bill}
          accounts={accounts}
          onSubmit={onSubmit}
          onCancel={onClose}
          submitting={submitting}
        />
      </div>
    </AppModal>
  );
};

export default BillPaymentModal;