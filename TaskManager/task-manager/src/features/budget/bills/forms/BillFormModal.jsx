import React from 'react';

import {
  AppModal,
  ModalHeader,
} from '@/components/ui';

import {
  useBillForm,
} from '@/features/budget/months/hooks/useBillForm';

import BillModalActions from '../payments/BillModalActions';
import BillPaymentDetails from '../payments/BillPaymentDetails';
import BillFormFields from './BillFormFields';
import CategoryFormModal from './CategoryFormModal';

/*===========================================================
  BillFormModal:
  => Coordinates the bill modal.
  => Delegates:
     - Modal behavior to AppModal
     - Header rendering to ModalHeader
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
  /*===========================================================
    Modal modes
  ===========================================================*/
  const isCreateMode =
    mode === 'create';

  const isEditMode =
    mode === 'edit';

  const isDetailsMode =
    mode === 'details';

  const actionInProgress =
    submitting ||
    reversingPayment;

  /*===========================================================
    Shared bill form hook
  ===========================================================*/
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
    Modal title
  ===========================================================*/
  const modalTitle =
    isCreateMode
      ? 'Add bill'
      : isEditMode
        ? 'Edit bill'
        : 'Bill details';

  /*===========================================================
    Modal description
  ===========================================================*/
  const modalDescription =
    isCreateMode
      ? 'Create a fixed expense obligation for this budget month.'
      : isEditMode
        ? 'Update this fixed expense obligation.'
        : 'Review the bill and its recorded payment details.';

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
      actionInProgress
    ) {
      return;
    }

    if (!validate()) {
      return;
    }

    onSubmit?.(
      getRequestData()
    );
  };

  return (
    <>
      {/*=======================================================
        Main bill modal
      =======================================================*/}
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
        ariaDescribedBy="bill-form-description"
      >
        <ModalHeader
          eyebrow={
            monthLabel
          }
          title={
            modalTitle
          }
          description={
            modalDescription
          }
          titleId="bill-form-title"
          descriptionId="bill-form-description"
          onClose={
            onClose
          }
          closeDisabled={
            actionInProgress
          }
        />

        {/*=====================================================
          Bill form
        =====================================================*/}
        <form
          onSubmit={
            handleSubmit
          }
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
            minDate={
              minDate
            }
            maxDate={
              maxDate
            }
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

          {/*===================================================
            Paid bill details
          ===================================================*/}
          {isDetailsMode && (
            <BillPaymentDetails
              bill={
                bill
              }
            />
          )}

          {/*===================================================
            Modal actions
          ===================================================*/}
          <BillModalActions
            mode={
              mode
            }
            onClose={
              onClose
            }
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

      {/*=======================================================
        Nested category modal
      =======================================================*/}
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