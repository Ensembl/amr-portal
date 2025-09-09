import { Signal } from 'signal-polyfill';

import type { FiltersConfig, FiltersView } from '../../types/filters/filtersConfig';

export type SelectedFilter = {
  category: string;
  value: string;
};
export type SelectedFiltersForViewModes = Record<string, SelectedFilter[]>;

export type FiltersUpdatePayload = {
  category: string;
  value: string;
  isSelected: boolean;
};



const viewMode = new Signal.State<string | null>(null);
const setViewMode = (mode: string) => {
  viewMode.set(mode);
  isViewingExtraFilters.set(false);
  const currentActiveFilterGroups = activeFilterGroups.get();

  activeFilterGroups.set({
    ...currentActiveFilterGroups,
    [mode]: null
  });
};

const filtersConfig = new Signal.State<FiltersConfig | null>(null);
const setFiltersConfig = (config: FiltersConfig) => filtersConfig.set(config);

const selectedFilters = new Signal.State<SelectedFiltersForViewModes>({});
const updateSelectedFilters = (payload: FiltersUpdatePayload) => {
  if (!viewMode.get()) {
    // this function should not be called if the view mode has not been set
    throw new Error('Selected filters can only be updated if view mode is set');
  }
  const { category, value: filterValue, isSelected } = payload;
  const currentViewMode = viewMode.get() as string;
  const storedFiltersForAllModes = selectedFilters.get();
  const storedFilters = storedFiltersForAllModes[currentViewMode];

  let updatedFilters: typeof storedFilters;

  if (isSelected) {
    const filter = { category: payload.category, value: payload.value };
    updatedFilters = storedFilters ? [...storedFilters, filter] : [filter];
  } else {
    updatedFilters = storedFilters.filter(storedFilter =>
      storedFilter.category !== category || storedFilter.value !== filterValue
    );
  }

  selectedFilters.set({
    ...storedFiltersForAllModes,
    [currentViewMode]: updatedFilters
  });
};
const selectedFiltersForViewMode = new Signal.Computed(() => {
  const currentViewMode = viewMode.get();
  const allSelectedFilters = selectedFilters.get();
  if (!currentViewMode) {
    return [];
  }
  return allSelectedFilters[currentViewMode] ?? [];
});

const isViewingExtraFilters = new Signal.State<boolean>(false);
const toggleExtraFilters = () => {
  const isViewing = isViewingExtraFilters.get();
  if (isViewing) {
    setActiveFilterGroup(null);
  } else {
    const filterGroups = filterGroupsForViewMode.get();
    const firstFilterGroup = filterGroups[0];
    setActiveFilterGroup(firstFilterGroup.name);
  }
  isViewingExtraFilters.set(!isViewing);
};

const filterGroupsForViewMode = new Signal.Computed(() => {
  const currentViewMode = viewMode.get();
  const filtersConfigValue = filtersConfig.get() as FiltersConfig;
  const filtersView = filtersConfigValue
    .filterViews.find(view => view.name === currentViewMode) as FiltersView;

  return filtersView.otherCategoryGroups;
});


const activeFilterGroups = new Signal.State<Record<string, string | null>>({});
const activeFilterGroup = new Signal.Computed<string | null>(() => {
  const currentViewMode: string | null = viewMode.get();
  const currentActiveFilterGroups: Record<string, string | null> = activeFilterGroups.get();
  if (!currentViewMode) {
    return null;
  }
  return currentActiveFilterGroups[currentViewMode] ?? null;
});
const setActiveFilterGroup = (filterGroupId: string | null) => {
  const currentViewMode = viewMode.get() as string;
  const currentActiveFilterGroups = activeFilterGroups.get();

  activeFilterGroups.set({
    ...currentActiveFilterGroups,
    [currentViewMode]: filterGroupId
  });
}

const currentViewConfig = new Signal.Computed(() => {
  const currentViewMode = viewMode.get();
  const filtersConfigValue = filtersConfig.get() as FiltersConfig;

  return filtersConfigValue.filterViews.find(view => view.name === currentViewMode) ?? null;
});


/**
 * A count of applied filters from the main filter category associated with a view
 */
const primaryFiltersCount = new Signal.Computed<number>(() => {
  const currentViewMode = viewMode.get();
  const viewConfig = currentViewConfig.get();
  const filtersForViewMode = selectedFiltersForViewMode.get();

  if (!currentViewMode || !viewConfig) {
    return 0;
  }

  const primaryFilterCategoryGroups = viewConfig.categoryGroups;
  const primaryFilterCategoryIds = primaryFilterCategoryGroups.reduce((ids, group) => {
    return ids.concat(...group.categories)
  }, [] as string[]);

  let count = 0;
  for (const filter of filtersForViewMode) {
    if (primaryFilterCategoryIds.includes(filter.category)) {
      count++;
    }
  }

  return count;
});

/**
 * A count of applied filters from other (non-main) filter categories associated with a view
 */
const otherFiltersCount = new Signal.Computed<number>(() => {
  const currentViewMode = viewMode.get();
  const viewConfig = currentViewConfig.get();
  const filtersForViewMode = selectedFiltersForViewMode.get();

  if (!currentViewMode || !viewConfig) {
    return 0;
  }

  const filterCategoryGroups = viewConfig.otherCategoryGroups;
  const filterCategoryIds = filterCategoryGroups.reduce((ids, group) => {
    return ids.concat(...group.categories)
  }, [] as string[]);

  let count = 0;
  for (const filter of filtersForViewMode) {
    if (filterCategoryIds.includes(filter.category)) {
      count++;
    }
  }

  return count;
});

const store = {
  viewMode,
  setViewMode,
  filtersConfig,
  setFiltersConfig,
  selectedFilters,
  selectedFiltersForViewMode,
  updateSelectedFilters,
  primaryFiltersCount,
  otherFiltersCount,
  isViewingExtraFilters,
  toggleExtraFilters,
  filterGroupsForViewMode,
  activeFilterGroups,
  activeFilterGroup,
  setActiveFilterGroup,
};


export default store;