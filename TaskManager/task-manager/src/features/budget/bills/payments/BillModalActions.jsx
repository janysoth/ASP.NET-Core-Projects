import React from 'react';

import {
  AppButton,
  ModalActions,
} from '@/components/ui';

/*===========================================================
  BillModalActions:
  => Displays the correct bill actions for create, edit,
     and details modes.
===========================================================*/
const BillModalActions = ({
  mode,
  onClose,
  onMarkUnpaid,
  submitting = false,
  reversingPayment = false,
  billIsPaid = false,
  canSubmit = true,
}) => {
  const isCreateMode =
    mode === 'create';

  const isDetailsMode =
    mode === 'details';

  const actionInProgress =
    submitting ||
    reversingPayment;

  return (
    <ModalActions>
      <AppButton
        variant="secondary"
        onClick={onClose}
        disabled={
          actionInProgress
        }
      >
        {isDetailsMode
          ? 'Close'
          : 'Cancel'}
      </AppButton>

      {isDetailsMode ? (
        <AppButton
          variant="warning"
          onClick={
            onMarkUnpaid
          }
          disabled={
            !billIsPaid
          }
          loading={
            reversingPayment
          }
          loadingText="Reversing payment..."
        >
          Mark unpaid
        </AppButton>
      ) : (
        <AppButton
          type="submit"
          variant="primary"
          disabled={
            !canSubmit
          }
          loading={
            submitting
          }
          loadingText="Saving..."
        >
          {isCreateMode
            ? 'Add bill'
            : 'Save changes'}
        </AppButton>
      )}
    </ModalActions>
  );
};

export default BillModalActions;