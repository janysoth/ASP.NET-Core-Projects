import React from 'react';

import {
  AppModal,
} from '@/components/ui';

import {
  XIcon,
} from '@/components/icons/Icons';

import {
  useBillForm,
} from '@/features/budget/months/hooks/useBillForm';

import BillFormFields from './BillFormFields';
import BillModalActions from './BillModalActions';
import BillPaymentDetails from './BillPaymentDetails';
import CategoryFormModal from './CategoryFormModal';

/*===========================================================
  BillFormModal:
  => Coordinates the bill modal.
  => Delegates:
     - Modal behavior to AppModal
     - Form state to useBillForm
     - Fields to BillFormFields
     - Payment display to BillPaymentDetails
     - Buttons to BillModalActions
===========================================================*/
const BillFormModal = ({
  mode = 'create',
  isOpen,
  onClose,
  onSubmit,
  onCreateCategory,
  onMarkUnpaid,
  categories = [],
  month,
  year,
  monthLabel,
  bill = null,
  submitting = false,
  reversingPayment = false,
}) => {
  const isCreateMode =
    mode === 'create';

  const isEditMode =
    mode === 'edit';

  const isDetailsMode =
    mode === 'details';

  const actionInProgress =
    submitting ||
    reversingPayment;

  const {
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
  } = useBillForm({
    isOpen,
    bill,
    categories,
    month,
    year,
    monthLabel,
    onCreateCategory,
  });

  /*===========================================================
    handleSubmit:
    => Creates or updates a bill.
    => Details mode cannot submit.
  ===========================================================*/
  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    if (
      isDetailsMode ||
      actionInProgress ||
      !validate()
    ) {
      return;
    }

    onSubmit?.(
      getRequestData()
    );
  };

  return (
    <>
      <AppModal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="max-w-xl"
        actionInProgress={
          actionInProgress
        }
        closeOnEscape={
          !isCategoryFormOpen
        }
        closeOnBackdrop={
          !isCategoryFormOpen
        }
        ariaLabelledBy="bill-form-title"
      >
        {/*=====================================================
          Header
        =====================================================*/}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--app-border)] px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-[var(--app-primary)]">
              {monthLabel}
            </p>

            <h2
              id="bill-form-title"
              className="mt-1 text-xl font-bold text-[var(--app-text)]"
            >
              {isCreateMode &&
                'Add bill'}

              {isEditMode &&
                'Edit bill'}

              {isDetailsMode &&
                'Bill details'}
            </h2>

            <p className="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
              {isCreateMode &&
                'Create a fixed expense obligation for this budget month.'}

              {isEditMode &&
                'Update this fixed expense obligation.'}

              {isDetailsMode &&
                'Review the bill and its recorded payment details.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={
              actionInProgress
            }
            aria-label="Close bill modal"
            className="rounded-lg p-2 text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/*=====================================================
          Form
        =====================================================*/}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 px-5 py-5"
        >
          <BillFormFields
            formValues={
              formValues
            }
            validationErrors={
              validationErrors
            }
            fixedExpenseCategories={
              fixedExpenseCategories
            }
            minDate={minDate}
            maxDate={maxDate}
            isDetailsMode={
              isDetailsMode
            }
            actionInProgress={
              actionInProgress
            }
            categorySubmitting={
              categorySubmitting
            }
            onChange={
              handleChange
            }
            onOpenCategoryForm={
              openCategoryForm
            }
          />

          {isDetailsMode && (
            <BillPaymentDetails
              bill={bill}
            />
          )}

          <BillModalActions
            mode={mode}
            onClose={onClose}
            onMarkUnpaid={
              onMarkUnpaid
            }
            submitting={
              submitting
            }
            reversingPayment={
              reversingPayment
            }
            billIsPaid={
              bill?.isPaid
            }
            canSubmit={
              fixedExpenseCategories.length >
              0
            }
          />
        </form>
      </AppModal>

      <CategoryFormModal
        isOpen={
          isCategoryFormOpen
        }
        onClose={
          closeCategoryForm
        }
        onSubmit={
          createCategory
        }
        monthLabel={
          monthLabel
        }
        submitting={
          categorySubmitting
        }
        apiError={
          categoryApiError
        }
      />
    </>
  );
};

export default BillFormModal;