import React from 'react';

import {
  AppButton,
  ModalActions,
} from '@/components/ui';

import ExpenseFormFields from '../components/ExpenseFormFields';

import useExpenseFormState from '../hooks/useExpenseFormState';

/*===========================================================
  ExpenseForm:
  => Coordinates the Expense form.

  Architecture:
  => useExpenseFormState owns state / validation.
  => ExpenseFormFields owns field UI.
  => ExpenseForm owns submission / actions.

  IMPORTANT:
  => Does NOT call the API directly.
===========================================================*/
const ExpenseForm = ({
  mode = 'create',

  expense = null,

  accounts = [],
  categories = [],

  createdCategoryId = '',

  accountsLoading = false,
  accountsError = '',

  onCreateCategory,
  onSubmit,
  onCancel,

  submitting = false,

  minDate = '',
  maxDate = '',

  monthLabel = '',
}) => {
  /*===========================================================
    Form State
  ===========================================================*/
  const {
    isEditing,

    formValues,
    validationErrors,

    handleFieldChange,
    createPayload,
  } = useExpenseFormState({
    mode,
    expense,

    accounts,
    categories,

    createdCategoryId,

    minDate,
    maxDate,

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
      <ExpenseFormFields
        accounts={
          accounts
        }
        categories={
          categories
        }
        accountId={
          formValues.accountId
        }
        categoryId={
          formValues.categoryId
        }
        name={
          formValues.name
        }
        amount={
          formValues.amount
        }
        expenseDate={
          formValues.expenseDate
        }
        notes={
          formValues.notes
        }
        validationErrors={
          validationErrors
        }
        accountsLoading={
          accountsLoading
        }
        accountsError={
          accountsError
        }
        disabled={
          submitting
        }
        minDate={
          minDate
        }
        maxDate={
          maxDate
        }
        onAccountChange={(value) =>
          handleFieldChange(
            'accountId',
            value
          )
        }
        onCategoryChange={(value) =>
          handleFieldChange(
            'categoryId',
            value
          )
        }
        onNameChange={(value) =>
          handleFieldChange(
            'name',
            value
          )
        }
        onAmountChange={(value) =>
          handleFieldChange(
            'amount',
            value
          )
        }
        onExpenseDateChange={(value) =>
          handleFieldChange(
            'expenseDate',
            value
          )
        }
        onNotesChange={(value) =>
          handleFieldChange(
            'notes',
            value
          )
        }
        onCreateCategory={
          onCreateCategory
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
              ? 'Saving expense...'
              : 'Adding expense...'
          }
        >
          {isEditing
            ? 'Save changes'
            : 'Add expense'}
        </AppButton>
      </ModalActions>
    </form>
  );
};

export default ExpenseForm;