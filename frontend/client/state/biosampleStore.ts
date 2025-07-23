import { Signal } from 'signal-polyfill';
import { AsyncComputed } from 'signal-utils/async-computed';

import type { SelectedFilter } from '../index';
import type { BackendInterface } from '../../data-provider/backendInterface';
// import type { LocalBackend, ApiBackend } from '../../data-provider/dataProvider';

/**
 * Likely additions to this model:
 * - Page number
 * - Number of biosamples per page
 * - Sorting column and order
 * 
 * QUESTION:
 * - How should the pagination be represented? Total number of pages
 */


const page = new Signal.State(1);
const setPage = (value: number) => page.set(value);

const perPage = new Signal.State(100);
const setPerPage = (value: number) => perPage.set(value);

const createBiosampleResource = ({
  selectedFilters,
  dataProvider
}: {
  selectedFilters: Signal.Computed<SelectedFilter[]>;
  // page: Signal.State<number>;
  // perPage: Signal.State<number>;
  dataProvider: BackendInterface;
}) => {
  const asyncResource = new AsyncComputed(async (abortSignal) => {
    const selectedFiltersValue = selectedFilters.get();

    if (!selectedFiltersValue.length) {
      return [];
    }

    const requestStarted = performance.now();

    const amrRecords = await dataProvider.getAMRRecords({
      filters: selectedFiltersValue,
      page: page.get(),
      perPage: perPage.get()
    });

    console.log('Time spent fetching data', Math.round(performance.now() - requestStarted), 'milliseconds');

    return amrRecords.data;
  });

  return asyncResource;
}

const store = {
  page,
  setPage,
  perPage,
  setPerPage,
  createBiosampleResource
};

export default store;