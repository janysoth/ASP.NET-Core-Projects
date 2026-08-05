import toast from 'react-hot-toast';

/*===========================================================
  showSuccess:
  => Displays a success toast.
===========================================================*/
export const showSuccess = (
  message
) => {
  toast.success(message);
};

/*===========================================================
  showError:
  => Displays an error toast.
===========================================================*/
export const showError = (
  message
) => {
  toast.error(message);
};

/*===========================================================
  showInfo:
  => Displays an informational toast.
===========================================================*/
export const showInfo = (
  message
) => {
  toast(message, {
    icon: 'ℹ️',
  });
};

/*===========================================================
  showLoading:
  => Displays a loading toast.
===========================================================*/
export const showLoading = (
  message = 'Loading...'
) => {
  return toast.loading(message);
};

/*===========================================================
  dismissToast:
  => Removes one or all toasts.
===========================================================*/
export const dismissToast = (
  toastId
) => {
  toast.dismiss(toastId);
};