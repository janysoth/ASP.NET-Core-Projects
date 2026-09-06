import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import useBillCategoryForm from './useBillCategoryForm';

import {
  buildBillRequest,
  getFixedExpenseCategories,
  getInitialBillFormValues,
  getMonthDateRange,
  validateBillForm,
} from '../utils/billFormUtils';

/*===========================================================
  useBillForm:
  => Owns Bill form state and validation.

  Handles:
  => Initial values.
  => Field changes.
  => Month date boundaries.
  => Fixed Expense categories.
  => Validation.
  => Request payload.

  Nested Category Workflow:
  => Delegated to useBillCategoryForm.
===========================================================*/
export const useBillForm = ({
  isOpen,

  bill,

  categories,

  month,
  year,

  monthLabel,

  onCreateCategory,
}) => {
  /*===========================================================
    Month Date Range
  ===========================================================*/
  const {
    minDate,
    maxDate,
    defaultDate,
  } = useMemo(
    () =>
      getMonthDateRange(
        month,
        year
      ),
    [
      month,
      year,
    ]
  );

  /*===========================================================
    Fixed Expense Categories
  ===========================================================*/
  const fixedExpenseCategories =
    useMemo(
      () =>
        getFixedExpenseCategories(
          categories
        ),
      [
        categories,
      ]
    );

  /*===========================================================
    Form Values
  ===========================================================*/
  const [
    formValues,
    setFormValues,
  ] = useState(
    getInitialBillFormValues(
      bill,
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
    Category Workflow
  ===========================================================*/
  const categoryForm =
    useBillCategoryForm({
      onCreateCategory,
      setFormValues,
      setValidationErrors,
    });

  const {
    resetCategoryForm,
  } = categoryForm;

  /*===========================================================
    Reset / Load Form
  ===========================================================*/
  useEffect(() => {
    if (
      !isOpen
    ) {
      return;
    }

    setFormValues(
      getInitialBillFormValues(
        bill,
        defaultDate
      )
    );

    setValidationErrors({});

    resetCategoryForm();
  }, [
    isOpen,
    bill,
    defaultDate,
    resetCategoryForm,
  ]);

  /*===========================================================
    Clear Field Error
  ===========================================================*/
  const clearFieldError =
    useCallback(
      (
        fieldName
      ) => {
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
    handleFieldChange:
    => Shared change method for modern reusable controls.

    Example:
    => handleFieldChange('dueDate', '2026-09-15')
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

        clearFieldError(
          fieldName
        );
      },
      [
        clearFieldError,
      ]
    );

  /*===========================================================
    Validate
  ===========================================================*/
  const validate =
    useCallback(() => {
      const errors =
        validateBillForm({
          formValues,
          minDate,
          maxDate,
          monthLabel,
        });

      setValidationErrors(
        errors
      );

      return (
        Object.keys(
          errors
        ).length === 0
      );
    }, [
      formValues,
      minDate,
      maxDate,
      monthLabel,
    ]);

  /*===========================================================
    Request Data
  ===========================================================*/
  const getRequestData =
    useCallback(
      () =>
        buildBillRequest(
          formValues
        ),
      [
        formValues,
      ]
    );

  return {
    formValues,
    validationErrors,
    fixedExpenseCategories,

    minDate,
    maxDate,

    isCategoryFormOpen:
      categoryForm
        .isCategoryFormOpen,

    categorySubmitting:
      categoryForm
        .categorySubmitting,

    categoryApiError:
      categoryForm
        .categoryApiError,

    handleFieldChange,

    validate,
    getRequestData,

    openCategoryForm:
      categoryForm
        .openCategoryForm,

    closeCategoryForm:
      categoryForm
        .closeCategoryForm,

    createCategory:
      categoryForm
        .createCategory,
  };
};