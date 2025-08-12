import { createStore } from 'solid-js/store';
import { FilterCategory, FilterCategoryGroup, FiltersConfig } from '../types/filtersConfig';
import { createEffect, on } from 'solid-js';
import { AMRRecordsResponse } from '../types/amrRecord';

const API_URL = 'http://localhost:8000';

export interface SelectedFilter {
  category: string;
  label: string;
  value: string;
}

interface AmrStoreState {
  filters: FiltersConfig;
  selectedMainFilters: SelectedFilter[];
  amrData: AMRRecordsResponse;
}

const getEmptyAmrData = (): AMRRecordsResponse => ({
  data: [],
  meta: {
    total_hits: 0,
    page: 1,
    per_page: 100,
  },
});

const createAmrStore = () => {
  const [store, setStore] = createStore<AmrStoreState>({
    filters: {} as FiltersConfig,
    selectedMainFilters: [],
    amrData: getEmptyAmrData(),
  });

  const fetchAmrFilters = async () => {
    try {
      const response = await fetch(`${API_URL}/filters-config`);
      const data = await response.json();
      setStore('filters', data);
    } catch (error) {
      console.error('Error fetching AMR filters:', error);
    }
  };

  const fetchAmrData = async (payload: Record<string, unknown>) => {
    try {
      const response = await fetch(`${API_URL}/amr-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as AMRRecordsResponse;
      setStore('amrData', data);
    } catch (error) {
      console.error('Error fetching AMR data:', error);
    }
  };

  const getFilterViews = () => {
    return store.filters?.filterViews || [];
  };

  const getFilterCategories = () => {
    return store.filters?.filterCategories || {};
  };

  const getSelectedMainFilters = () => {
    return store.selectedMainFilters;
  };

  const getMainCategoryFilters = (viewName: string, searchTerm: string): SelectedFilter[] => {
    const mainView = getFilterViews().find((v) => v.name === viewName);
    const categories = mainView?.categoryGroups?.[0]?.categories ?? [];
    const lowerSearch = searchTerm.trim().toLowerCase();

    return categories.flatMap((category) => {
      const categoryFilters = getFilterCategories()[category]?.filters ?? [];
      return categoryFilters
        .filter((cf) => !lowerSearch || cf.label.toLowerCase().includes(lowerSearch))
        .map((cf) => ({
          category,
          value: cf.value,
          label: cf.label,
        }));
    });
  };

  const getOtherCategoryFilters = (viewName: string): FilterCategoryGroup[] => {
    const mainView = getFilterViews().find((v) => v.name === viewName);
    return mainView?.otherCategoryGroups || [];
  };

  const getFilterCategoryById = (categoryId: string): FilterCategory | undefined => {
    const filterCategories = getFilterCategories();

    for (const [cId, category] of Object.entries(filterCategories)) {
      if (cId === categoryId) {
        return category;
      }
    }
    return undefined;
  };

  const addFilterSelection = (filter: SelectedFilter) => {
    setStore('selectedMainFilters', [...store.selectedMainFilters, filter]);
  };

  const removeFilterSelection = (filter: SelectedFilter) => {
    setStore('selectedMainFilters', (filters) => {
      const updated = filters.filter((f) => f.value !== filter.value);
      if (updated.length === 0) {
        setStore('amrData', getEmptyAmrData());
      }
      return updated;
    });
  };

  createEffect(
    on(
      () => store.selectedMainFilters,
      (filters, prevFilters) => {
        if (!prevFilters) return; // skip initial run
        if (filters.length === 0) return;

        const updatedFilters = filters.map((f) => ({
          category: f.category,
          value: f.value,
        }));

        const payload: Record<string, unknown> = {
          selected_filters: updatedFilters,
          page: 1,
          per_page: 100,
        };

        fetchAmrData(payload);
      }
    )
  );

  const clearAmrData = () => {
    setStore('selectedMainFilters', []);
    setStore('amrData', getEmptyAmrData());
  };

  return {
    store,
    fetchAmrFilters,
    getFilterViews,
    getSelectedMainFilters,
    getMainCategoryFilters,
    addFilterSelection,
    removeFilterSelection,
    clearAmrData,
    getOtherCategoryFilters,
    getFilterCategoryById,
  };
};

const amrStore = createAmrStore();

export default amrStore;
