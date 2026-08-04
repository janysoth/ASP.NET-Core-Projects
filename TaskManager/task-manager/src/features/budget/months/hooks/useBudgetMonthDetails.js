import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  getBudgetMonthById,
} from '../../dashboard/api/budgetDashboardApi';

import {
  getApiErrorMessage,
} from '../../utils/budgetErrors';

/*===========================================================
  useBudgetMonthDetails:
  => Loads one complete budget month.
  => Separates the initial loading state from later refreshes.
  => Keeps existing page data visible during a refresh.
===========================================================*/
export const useBudgetMonthDetails = (
  budgetMonthId
) => {
  const [
    budgetMonth,
    setBudgetMonth,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    refreshError,
    setRefreshError,
  ] = useState('');

  /*===========================================================
    fetchBudgetMonth:
    => Loads the selected budget month.

    initialLoad = true:
    => Uses the full-page loading and error states.

    initialLoad = false:
    => Uses the background refreshing and refresh-error states.
  ===========================================================*/
  const fetchBudgetMonth =
    useCallback(
      async ({
        initialLoad = false,
      } = {}) => {
        if (!budgetMonthId) {
          const missingIdMessage =
            'Budget month ID is required.';

          if (initialLoad) {
            setError(
              missingIdMessage
            );

            setLoading(false);
          } else {
            setRefreshError(
              missingIdMessage
            );

            setRefreshing(false);
          }

          return null;
        }

        try {
          if (initialLoad) {
            setLoading(true);
            setError('');
          } else {
            setRefreshing(true);
            setRefreshError('');
          }

          const response =
            await getBudgetMonthById(
              budgetMonthId
            );

          setBudgetMonth(
            response
          );

          return response;
        } catch (requestError) {
          const message =
            getApiErrorMessage(
              requestError,
              'Unable to load the budget month.'
            );

          if (initialLoad) {
            setError(
              message
            );
          } else {
            setRefreshError(
              message
            );
          }

          return null;
        } finally {
          if (initialLoad) {
            setLoading(false);
          } else {
            setRefreshing(false);
          }
        }
      },
      [
        budgetMonthId,
      ]
    );

  /*===========================================================
    Initial page load:
    => Loads the month whenever the route ID changes.
  ===========================================================*/
  useEffect(() => {
    setBudgetMonth(null);
    setRefreshError('');

    fetchBudgetMonth({
      initialLoad: true,
    });
  }, [
    fetchBudgetMonth,
  ]);

  /*===========================================================
    refreshBudgetMonth:
    => Reloads data without replacing the page with the
       full-page loading screen.
  ===========================================================*/
  const refreshBudgetMonth =
    useCallback(async () => {
      return await fetchBudgetMonth({
        initialLoad: false,
      });
    }, [
      fetchBudgetMonth,
    ]);

  /*===========================================================
    clearRefreshError:
    => Allows the page to dismiss an old refresh error.
  ===========================================================*/
  const clearRefreshError =
    useCallback(() => {
      setRefreshError('');
    }, []);

  return {
    budgetMonth,
    loading,
    refreshing,
    error,
    refreshError,

    refreshBudgetMonth,
    clearRefreshError,
  };
};