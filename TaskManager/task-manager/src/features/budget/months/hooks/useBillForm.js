import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  buildBillRequest,
  getFixedExpenseCategories,
  getInitialBillFormValues,
  getMonthDateRange,
  validateBillForm,
} from '../utils/billFormUtils';

/*===========================================================
  useBillForm:
  => Owns bill form state, validation, and category creation.
  => Keeps BillFormModal focused on layout and composition.
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

  const [
    formValues,
    setFormValues,
  ] = useState(
    getInitialBillFormValues(
      bill,
      defaultDate
    )
  );

  const [
    validationErrors,
    setValidationErrors,
  ] = useState({});

  const [
    isCategoryFormOpen,
    setIsCategoryFormOpen,
  ] = useState(false);

  const [
    categorySubmitting,
    setCategorySubmitting,
  ] = useState(false);

  const [
    categoryApiError,
    setCategoryApiError,
  ] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormValues(
      getInitialBillFormValues(
        bill,
        defaultDate
      )
    );

    setValidationErrors({});
    setIsCategoryFormOpen(false);
    setCategoryApiError('');
  }, [
    isOpen,
    bill,
    defaultDate,
  ]);

  const handleChange =
    useCallback(
      (event) => {
        const {
          name,
          value,
        } = event.target;

        setFormValues(
          (currentValues) => ({
            ...currentValues,
            [name]: value,
          })
        );

        setValidationErrors(
          (currentErrors) => {
            if (!currentErrors[name]) {
              return currentErrors;
            }

            const updatedErrors = {
              ...currentErrors,
            };

            delete updatedErrors[name];

            return updatedErrors;
          }
        );
      },
      []
    );

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
        Object.keys(errors).length ===
        0
      );
    }, [
      formValues,
      minDate,
      maxDate,
      monthLabel,
    ]);

  const getRequestData =
    useCallback(() => {
      return buildBillRequest(
        formValues
      );
    }, [
      formValues,
    ]);

  const openCategoryForm =
    useCallback(() => {
      setCategoryApiError('');
      setIsCategoryFormOpen(true);
    }, []);

  const closeCategoryForm =
    useCallback(() => {
      if (categorySubmitting) {
        return;
      }

      setIsCategoryFormOpen(false);
      setCategoryApiError('');
    }, [
      categorySubmitting,
    ]);

  const createCategory =
    useCallback(
      async (
        categoryData
      ) => {
        if (!onCreateCategory) {
          setCategoryApiError(
            'Category creation is unavailable.'
          );

          return null;
        }

        try {
          setCategorySubmitting(true);
          setCategoryApiError('');

          const createdCategory =
            await onCreateCategory(
              categoryData
            );

          if (!createdCategory?.id) {
            throw new Error(
              'The category was created, but no category ID was returned.'
            );
          }

          setFormValues(
            (currentValues) => ({
              ...currentValues,

              budgetCategoryId:
                createdCategory.id,
            })
          );

          setValidationErrors(
            (currentErrors) => {
              const updatedErrors = {
                ...currentErrors,
              };

              delete updatedErrors
                .budgetCategoryId;

              return updatedErrors;
            }
          );

          setIsCategoryFormOpen(false);
          setCategoryApiError('');

          return createdCategory;
        } catch (requestError) {
          setCategoryApiError(
            requestError?.message ||
            'Unable to create category.'
          );

          return null;
        } finally {
          setCategorySubmitting(false);
        }
      },
      [
        onCreateCategory,
      ]
    );

  return {
    formValues,
    validationErrors,
    fixedExpenseCategories,

    minDate,
    maxDate,

    isCategoryFormOpen,
    categorySubmitting,
    categoryApiError,

    handleChange,
    validate,
    getRequestData,

    openCategoryForm,
    closeCategoryForm,
    createCategory,
  };
};