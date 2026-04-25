export const getApiError = (err) => {
  return {
    message:
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      'Something went wrong',
    code: err?.response?.data?.code || null,
  };
};