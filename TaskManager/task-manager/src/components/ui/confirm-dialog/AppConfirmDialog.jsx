import React from 'react';

import {
  AppButton,
  AppModal,
  ModalActions,
  ModalHeader,
} from '@/components/ui';

/*===========================================================
  AppConfirmDialog:
  => Shared confirmation dialog for destructive or important
     actions.
===========================================================*/
const AppConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,

  title = 'Are you sure?',
  description = '',

  confirmText = 'Confirm',
  cancelText = 'Cancel',

  variant = 'danger',

  loading = false,
  loadingText = 'Working...',

  eyebrow,
}) => {
  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      actionInProgress={loading}
      ariaLabelledBy="confirm-dialog-title"
      ariaDescribedBy="confirm-dialog-description"
    >
      <ModalHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        titleId="confirm-dialog-title"
        descriptionId="confirm-dialog-description"
        onClose={onClose}
        closeDisabled={loading}
      />

      <div className="px-5 py-5">
        <ModalActions>
          <AppButton
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </AppButton>

          <AppButton
            variant={variant}
            onClick={onConfirm}
            loading={loading}
            loadingText={loadingText}
          >
            {confirmText}
          </AppButton>
        </ModalActions>
      </div>
    </AppModal>
  );
};

export default AppConfirmDialog;