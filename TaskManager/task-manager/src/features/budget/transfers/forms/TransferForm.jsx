import React from 'react';

import {
  AppButton,
  ModalActions,
} from '@/components/ui';

import TransferFormFields from '../components/TransferFormFields';

import useTransferFormState from '../hooks/useTransferFormState';

/*===========================================================
  TransferForm:
  => Coordinates the Transfer form.

  Supports:
  => Create mode.
  => Edit mode.

  Architecture:
  => useTransferFormState owns field state / validation.
  => TransferFormFields owns field UI.
  => TransferForm owns submit / action buttons.

  IMPORTANT:
  => Does NOT call the API directly.
===========================================================*/
const TransferForm = ({
  mode = 'create',

  transfer = null,

  accounts = [],

  monthLabel = '',

  onSubmit,
  onCancel,

  submitting = false,
}) => {
  /*===========================================================
    Form State
  ===========================================================*/
  const {
    isEditing,

    formValues,
    validationErrors,

    minDate,
    maxDate,

    handleFieldChange,
    createPayload,
  } = useTransferFormState({
    mode,
    transfer,
    accounts,
    monthLabel,
  });

  /*===========================================================
    Submit
  ===========================================================*/
  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    if (
      submitting
    ) {
      return;
    }

    const payload =
      createPayload();

    if (!payload) {
      return;
    }

    onSubmit?.(
      payload
    );
  };

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-5"
    >
      {/*=======================================================
        Fields
      =======================================================*/}
      <TransferFormFields
        accounts={
          accounts
        }
        formValues={
          formValues
        }
        validationErrors={
          validationErrors
        }
        minDate={
          minDate
        }
        maxDate={
          maxDate
        }
        disabled={
          submitting
        }
        onFieldChange={
          handleFieldChange
        }
      />

      {/*=======================================================
        Actions
      =======================================================*/}
      <ModalActions>
        <AppButton
          variant="secondary"
          onClick={
            onCancel
          }
          disabled={
            submitting
          }
        >
          Cancel
        </AppButton>

        <AppButton
          type="submit"
          variant="primary"
          loading={
            submitting
          }
          loadingText={
            isEditing
              ? 'Saving transfer...'
              : 'Creating transfer...'
          }
        >
          {isEditing
            ? 'Save changes'
            : 'Create transfer'}
        </AppButton>
      </ModalActions>
    </form>
  );
};

export default TransferForm;