/*===========================================================
  getApiErrorMessage:
  => Extracts a readable error message from:
     - Standard backend responses
     - Axios errors
     - Native JavaScript errors
===========================================================*/
export const getApiErrorMessage = (
  error,
  fallbackMessage =
    'Something went wrong.'
) => {
  const responseData =
    error?.response?.data;

  if (
    typeof responseData ===
    'string'
  ) {
    return responseData;
  }

  return (
    responseData?.message ||
    error?.message ||
    fallbackMessage
  );
};