import React from 'react';

/*===========================================================
  BillModalActions:
  => Displays the correct footer actions for create, edit,
     and details modes.
===========================================================*/
const BillModalActions = ({
  mode,
  onClose,
  onMarkUnpaid,
  submitting = false,
  reversingPayment = false,
  billIsPaid = false,
  canSubmit = true,
}) => {
  const isCreateMode =
    mode === 'create';

  const isDetailsMode =
    mode === 'details';

  const actionInProgress =
    submitting ||
    reversingPayment;

  return (
    <div className="flex flex-col-reverse gap-3 border-t border-[var(--app-border)] pt-5 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        disabled={actionInProgress}
        className="rounded-xl border border-[var(--app-border)] px-4 py-2.5 text-sm font-semibold text-[var(--app-text)] transition-colors hover:bg-[var(--app-surface-muted)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isDetailsMode
          ? 'Close'
          : 'Cancel'}
      </button>

      {isDetailsMode ? (
        <button
          type="button"
          onClick={onMarkUnpaid}
          disabled={
            actionInProgress ||
            !billIsPaid
          }
          className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {reversingPayment
            ? 'Reversing payment...'
            : 'Mark unpaid'}
        </button>
      ) : (
        <button
          type="submit"
          disabled={
            actionInProgress ||
            !canSubmit
          }
          className="rounded-xl bg-[var(--app-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--app-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? 'Saving...'
            : isCreateMode
              ? 'Add bill'
              : 'Save changes'}
        </button>
      )}
    </div>
  );
};

export default BillModalActions;