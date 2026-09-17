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
  useTransferFormState:
  => Owns Transfer form field state and validation.

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
  accounts = [],

  monthLabel = '',
}) => {
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
      getInitialTransferFormValues(
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
    Reset When Budget Month Changes
  ===========================================================*/
  useEffect(() => {
    setFormValues(
      getInitialTransferFormValues(
        defaultDate
      )
    );

    setValidationErrors({});
  }, [
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
              ]
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
              Changing either account can also affect the
              same-account validation error.
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
    Create Payload
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
    formValues,
    validationErrors,

    minDate,
    maxDate,

    handleFieldChange,
    createPayload,
  };
};

export default useTransferFormState;