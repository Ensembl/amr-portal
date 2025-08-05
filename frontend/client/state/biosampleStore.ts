import { Signal } from 'signal-polyfill';
import { AsyncComputed } from 'signal-utils/async-computed';

import type { SelectedFilter } from '../index';
import type { BackendInterface, AMRRecordsFetchParams } from '../../data-provider/backendInterface';


type SortingOrder = 'asc' | 'desc';

type OrderPayload = {
  category: string;
  order: SortingOrder;
};

const DEFAULT_NUM_ITEMS_PER_PAGE = 100;

const page = new Signal.State(1);
const setPage = (value: number) => page.set(value);

const perPage = new Signal.State(DEFAULT_NUM_ITEMS_PER_PAGE);
const setPerPage = (value: number) => perPage.set(value);

const order = new Signal.State<OrderPayload | null>(null);
const setOrder = (category: string) => {
  const currentOrder = order.get();
  if (!currentOrder) {
    order.set({ category, order: 'asc' });
  } else if (currentOrder.order === 'asc') {
    order.set({ category, order: 'desc' });
  } else {
    order.set(null)
  }
};

const resetPageAndOrder = () => {
  page.set(1);
  perPage.set(DEFAULT_NUM_ITEMS_PER_PAGE);
  order.set(null);
};

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

    const requestParams: AMRRecordsFetchParams = {
      filters: selectedFiltersValue,
      page: page.get(),
      perPage: perPage.get()
    };

    const currentOrder = order.get();

    if (currentOrder) {
      requestParams.orderBy = {
        category: currentOrder.category,
        order: currentOrder.order.toUpperCase() as 'ASC' | 'DESC'
      }
    }

    const amrRecords = await dataProvider.getAMRRecords(requestParams);

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
  order,
  setOrder,
  resetPageAndOrder,
  createBiosampleResource
};

export default store;