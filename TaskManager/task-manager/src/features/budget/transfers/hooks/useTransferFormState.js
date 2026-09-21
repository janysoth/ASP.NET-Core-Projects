import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getBudgetMonthDateRangeFromLabel,
} from '@/features/budget/utils/budgetDateUtils';

import {
  buildTransferRequest,
  getInitialTransferFormValues,
  validateTransferForm,
} from '../utils/transferFormUtils';

/*===========================================================
  getTransferDateValue:
  => Converts an API date into YYYY-MM-DD.

  Example:
  => 2026-09-15T00:00:00Z
  => 2026-09-15
===========================================================*/
const getTransferDateValue = (
  value
) => {
  if (!value) {
    return '';
  }

  return String(
    value
  ).slice(
    0,
    10
  );
};

/*===========================================================
  getEditTransferValues:
  => Converts an existing Transfer into form values.
===========================================================*/
const getEditTransferValues = (
  transfer,
  defaultDate
) => {
  if (!transfer) {
    return getInitialTransferFormValues(
      defaultDate
    );
  }

  return {
    fromAccountId:
      transfer.fromAccountId ??
      '',

    toAccountId:
      transfer.toAccountId ??
      '',

    amount:
      transfer.amount
        ?.toString() ??
      '',

    transferDate:
      getTransferDateValue(
        transfer.transferDate
      ) ||
      defaultDate,

    notes:
      transfer.notes ??
      '',
  };
};

/*===========================================================
  useTransferFormState:
  => Owns Transfer form field state and validation.

  Supports:
  => Create mode.
  => Edit mode.

  Handles:
  => From Account.
  => To Account.
  => Amount.
  => Transfer Date.
  => Notes.
  => Budget Month date range.
  => Validation.
  => Request payload creation.

  IMPORTANT:
  => Does NOT call the API.
  => Does NOT own modal state.
===========================================================*/
const useTransferFormState = ({
  mode = 'create',

  transfer = null,

  accounts = [],

  monthLabel = '',
}) => {
  /*===========================================================
    Edit Mode
  ===========================================================*/
  const isEditing =
    mode === 'edit';

  /*===========================================================
    Budget Month Date Range
  ===========================================================*/
  const {
    minDate,
    maxDate,
    defaultDate,
  } = useMemo(
    () =>
      getBudgetMonthDateRangeFromLabel(
        monthLabel
      ),
    [
      monthLabel,
    ]
  );

  /*===========================================================
    Form Values
  ===========================================================*/
  const [
    formValues,
    setFormValues,
  ] = useState(
    () =>
      getEditTransferValues(
        isEditing
          ? transfer
          : null,
        defaultDate
      )
  );

  /*===========================================================
    Validation Errors
  ===========================================================*/
  const [
    validationErrors,
    setValidationErrors,
  ] = useState({});

  /*===========================================================
    Load / Reset Form:
    => Edit mode loads selected Transfer.
    => Create mode restores empty/default values.
  ===========================================================*/
  useEffect(() => {
    setFormValues(
      getEditTransferValues(
        isEditing
          ? transfer
          : null,
        defaultDate
      )
    );

    setValidationErrors({});
  }, [
    isEditing,
    transfer,
    defaultDate,
  ]);

  /*===========================================================
    Change Field
  ===========================================================*/
  const handleFieldChange =
    useCallback(
      (
        fieldName,
        value
      ) => {
        setFormValues(
          (
            currentValues
          ) => ({
            ...currentValues,

            [fieldName]:
              value,
          })
        );

        setValidationErrors(
          (
            currentErrors
          ) => {
            if (
              !currentErrors[
              fieldName
              ] &&
              fieldName !==
              'fromAccountId' &&
              fieldName !==
              'toAccountId'
            ) {
              return currentErrors;
            }

            const updatedErrors = {
              ...currentErrors,
            };

            delete updatedErrors[
              fieldName
            ];

            /*
              From / To validation are related.

              Example:
              => Same-account error may disappear when either
                 account changes.
            */
            if (
              fieldName ===
              'fromAccountId' ||
              fieldName ===
              'toAccountId'
            ) {
              delete updatedErrors
                .fromAccountId;

              delete updatedErrors
                .toAccountId;
            }

            return updatedErrors;
          }
        );
      },
      []
    );

  /*===========================================================
    Create Payload:
    => Validates both Create and Edit forms.
    => Returns null when invalid.

    IMPORTANT:
    => We currently send the complete Transfer form for PATCH.
    => Backend accepts supplied PATCH fields normally.
  ===========================================================*/
  const createPayload =
    useCallback(() => {
      const errors =
        validateTransferForm({
          ...formValues,

          accounts,

          minDate,
          maxDate,

          monthLabel,
        });

      setValidationErrors(
        errors
      );

      if (
        Object.keys(
          errors
        ).length > 0
      ) {
        return null;
      }

      return buildTransferRequest(
        formValues
      );
    }, [
      formValues,
      accounts,
      minDate,
      maxDate,
      monthLabel,
    ]);

  return {
    /*=========================================================
      Mode
    =========================================================*/
    isEditing,

    /*=========================================================
      State
    =========================================================*/
    formValues,
    validationErrors,

    /*=========================================================
      Date Range
    =========================================================*/
    minDate,
    maxDate,

    /*=========================================================
      Actions
    =========================================================*/
    handleFieldChange,
    createPayload,
  };
};

export default useTransferFormState;