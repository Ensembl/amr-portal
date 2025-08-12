export type Filter = {
  label: string;
  value: string; // ??? how do we represent null values?
};

export type FilterCategory = {
  id: string;
  label: string;
  filters: Filter[];
};

export type FilterCategoriesMap = Record<string, FilterCategory>;

export type FilterCategoryGroup = {
  name: string;
  categories: string[]; // an array of filter category ids
};

export type FiltersView = {
  name: string;
  categoryGroups: FilterCategoryGroup[];
  otherCategoryGroups: FilterCategoryGroup[]; // order in the array will be used for display order
};

export type FiltersConfig = {
  filterCategories: FilterCategoriesMap;
  filterViews: FiltersView[];
};
