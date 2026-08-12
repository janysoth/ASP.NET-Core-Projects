import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  getBills,
} from '@/features/budget/api/budgetApi';

import {
  getApiErrorMessage,
} from '@/features/budget/utils/budgetErrors';

import {
  sortBills,
} from '@/features/budget/utils/billUtils';

/*===========================================================
  useBillsData:
  => Owns bill-list data for one budget month.

  Handles:
  => Loading bills.
  => Sorting bills.
  => Loading state.
  => Error state.
  => Manual refresh.
===========================================================*/
export const useBillsData = ({
  month,
  year,
}) => {
  const [
    bills,
    setBills,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  /*===========================================================
    loadBills:
    => Loads bills for the selected month/year.
    => Sorts the response before storing it.
  ===========================================================*/
  const loadBills =
    useCallback(async () => {
      if (
        !month ||
        !year
      ) {
        setBills([]);
        setLoading(false);
        setError('');

        return [];
      }

      try {
        setLoading(true);
        setError('');

        const response =
          await getBills(
            month,
            year
          );

        const normalizedBills =
          Array.isArray(response)
            ? response
            : [];

        const sortedBills =
          sortBills(
            normalizedBills
          );

        setBills(
          sortedBills
        );

        return sortedBills;
      } catch (
      requestError
      ) {
        const message =
          getApiErrorMessage(
            requestError,
            'Unable to load bills.'
          );

        setError(
          message
        );

        return [];
      } finally {
        setLoading(false);
      }
    }, [
      month,
      year,
    ]);

  /*===========================================================
    Initial bill load:
    => Reloads automatically whenever month/year changes.
  ===========================================================*/
  useEffect(() => {
    loadBills();
  }, [
    loadBills,
  ]);

  return {
    bills,
    loading,
    error,
    loadBills,
  };
};