import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { buildExpenseRequest, validateExpenseForm } from '../utils/expenseFormUtils';

/*===========================================================
  getTodayDateValue:
  => Returns today's local date as YYYY-MM-DD.

  IMPORTANT:
  => Avoids UTC shifting from toISOString().
===========================================================*/
const getTodayDateValue = () => {
  const today =
    new Date();

  const year =
    today.getFullYear();

  const month =
    String(
      today.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      today.getDate()
    ).padStart(
      2,
      '0'
    );

  return `${year}-${month}-${day}`;
};

/*===========================================================
  getInitialValues:
  => Creates form values for Create or Edit mode.
===========================================================*/
const getInitialValues = (
  expense,
  defaultExpenseDate
) => ({
  accountId:
    expense?.accountId ??
    '',

  categoryId:
    expense?.categoryId ??
    '',

  name:
    expense?.name ??
    '',

  amount:
    expense?.amount
      ?.toString() ??
    '',

  expenseDate:
    expense?.expenseDate
      ?.slice(
        0,
        10
      ) ??
    defaultExpenseDate,

  notes:
    expense?.notes ??
    '',
});

/*===========================================================
  useExpenseFormState:
  => Owns Expense field state and validation.

  Handles:
  => Create / Edit values.
  => Newly-created Category selection.
  => Field changes.
  => Validation.
  => Request payload creation.

  IMPORTANT:
  => Does NOT own modal state.
  => Does NOT call the API.
===========================================================*/
const useExpenseFormState = ({
  mode = 'create',

  expense = null,

  accounts = [],
  categories = [],

  createdCategoryId = '',

  minDate = '',
  maxDate = '',

  monthLabel = '',
}) => {
  /*===========================================================
    Mode
  ===========================================================*/
  const isEditing =
    mode === 'edit';

  /*===========================================================
    Default Date
  ===========================================================*/
  const defaultExpenseDate =
    useMemo(
      () =>
        getTodayDateValue(),
      []
    );

  /*===========================================================
    Form Values
  ===========================================================*/
  const [
    formValues,
    setFormValues,
  ] = useState(
    () =>
      getInitialValues(
        expense,
        defaultExpenseDate
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
    Reset / Load
  ===========================================================*/
  useEffect(() => {
    setFormValues(
      getInitialValues(
        isEditing
          ? expense
          : null,
        defaultExpenseDate
      )
    );

    setValidationErrors({});
  }, [
    isEditing,
    expense,
    defaultExpenseDate,
  ]);

  /*===========================================================
    Newly-Created Category
  ===========================================================*/
  useEffect(() => {
    if (
      !createdCategoryId
    ) {
      return;
    }

    setFormValues(
      (
        currentValues
      ) => ({
        ...currentValues,

        categoryId:
          createdCategoryId,
      })
    );

    setValidationErrors(
      (
        currentErrors
      ) => {
        const updatedErrors = {
          ...currentErrors,
        };

        delete updatedErrors
          .categoryId;

        return updatedErrors;
      }
    );
  }, [
    createdCategoryId,
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

            return updatedErrors;
          }
        );
      },
      []
    );

  /*===========================================================
    Create Payload:
    => Validates first.
    => Returns null when invalid.
  ===========================================================*/
  const createPayload =
    useCallback(() => {
      const errors =
        validateExpenseForm({
          ...formValues,

          accounts,
          categories,

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

      return buildExpenseRequest(
        formValues
      );
    }, [
      formValues,
      accounts,
      categories,
      minDate,
      maxDate,
      monthLabel,
    ]);

  return {
    isEditing,

    formValues,
    validationErrors,

    handleFieldChange,
    createPayload,
  };
};

export default useExpenseFormState;