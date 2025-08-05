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

type QueryState = {
  filters: SelectedFilter[];
  page: number;
  perPage: number;
  orderBy: OrderPayload | null;
}

const initialQueryState: QueryState = {
  filters: [] as SelectedFilter[],
  page: 1,
  perPage: DEFAULT_NUM_ITEMS_PER_PAGE,
  orderBy: null
};

const amrQueryState = new Signal.State(initialQueryState);

const setFilters = (filters: SelectedFilter[]) => {
  amrQueryState.set({
    ...initialQueryState,
    filters
  });
};

const page = new Signal.Computed(() => {
  return amrQueryState.get().page;
});

const setPage = (page: number) => {
  const currentState = amrQueryState.get();
  amrQueryState.set({
    ...currentState,
    page
  });
};

const perPage = new Signal.Computed(() => {
  return amrQueryState.get().perPage;
});

const setPerPage = (perPage: number) => {
  const currentState = amrQueryState.get();
  amrQueryState.set({
    ...currentState,
    perPage
  });
};

const order = new Signal.Computed(() => {
  return amrQueryState.get().orderBy ?? null;
});

const setOrder = (category: string) => {
  const currentState = amrQueryState.get();
  const currentOrder = currentState.orderBy;
  let nextOrder: QueryState['orderBy'];
  if (!currentOrder) {
    nextOrder = { category, order: 'asc' };
  } else if (currentOrder.order === 'asc') {
    nextOrder = { category, order: 'desc' };
  } else {
    nextOrder = null;
  }

  amrQueryState.set({
    ...currentState,
    orderBy: nextOrder
  });
};

const createBiosampleResource = ({
  dataProvider
}: {
  dataProvider: BackendInterface;
}) => {
  const asyncResource = new AsyncComputed(async (abortSignal) => {
    const queryParams = amrQueryState.get();
    const selectedFilters = queryParams.filters;

    if (!selectedFilters.length) {
      return [];
    }

    const requestStarted = performance.now();

    const requestParams: AMRRecordsFetchParams = {
      filters: selectedFilters,
      page: queryParams.page,
      perPage: queryParams.perPage
    };

    const currentOrder = queryParams.orderBy;

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
  setFilters,
  createBiosampleResource
};

export default store;