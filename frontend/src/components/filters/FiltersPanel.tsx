import { createSignal, Match, onMount, Switch, type Component } from 'solid-js';

import ChevronIcon from '../../icons/ChevronIcon';
import Checkbox from '../../elements/Checkbox/Checkbox';

import amrStore, { SelectedFilter } from '../../store/amrStore';

import './FiltersPanel.css';
import ShadedInput from '../../elements/ShadedInput/ShadedInput';
import {
  Filter,
  FilterCategoriesMap,
  FilterCategory,
  FilterCategoryGroup,
} from '../../types/filtersConfig';

const FiltersPanel: Component = () => {
  const [otherFiltersOpen, setOtherFiltersOpen] = createSignal(false);
  const [filtersPanelOpen, setFiltersPanelOpen] = createSignal(true);
  const [activeView, setActiveView] = createSignal<string>('');
  const [searchTerm, setSearchTerm] = createSignal<string>('');

  const {
    store,
    fetchAmrFilters,
    getFilterViews,
    addFilterSelection,
    removeFilterSelection,
    clearAmrData,
  } = amrStore;

  onMount(async () => {
    await fetchAmrFilters();
    const filterViews = getFilterViews();
    if (filterViews.length > 0) {
      setActiveView(filterViews[0].name);
    }
  });

  const toggleFiltersPanel = () => {
    setFiltersPanelOpen(!filtersPanelOpen());
  };

  const handleSelectedMainFiltersChange = (event: Event, filter: SelectedFilter) => {
    const ele = event.target as HTMLInputElement;
    if (ele.checked) {
      console.log('Adding filter:', filter);
      addFilterSelection(filter);
    } else {
      console.log('Removing filter:', filter);
      removeFilterSelection(filter);
    }
  };

  const handleActiveViewChange = (viewName: string) => {
    if (activeView() !== viewName) {
      setActiveView(viewName);
      clearAmrData();
      setOtherFiltersOpen(false);
    }

    if (otherFiltersOpen()) {
      setOtherFiltersOpen(false);
    }
  };

  return (
    <div class="filters-container">
      <div class="filters-toggle-container">
        <button class="filters-chevron-icon-button text-button" onClick={toggleFiltersPanel}>
          <ChevronIcon
            class="filters-chevron-icon"
            fill="#0099FF"
            style={{
              transform: filtersPanelOpen() ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
            }}
          />
        </button>
      </div>
      <Switch>
        <Match when={!filtersPanelOpen()}>
          <div class="filters-panel-closed">
            <div style={{ display: 'flex', 'flex-direction': 'row', 'align-items': 'center' }}>
              <div style={{ 'margin-left': '30px', 'font-size': '12px' }}>
                <span>Data</span>
              </div>
              <div
                style={{
                  'margin-left': '20px',
                  'font-size': '13px',
                  'font-weight': 'bold',
                  color: '#0099FF',
                }}
              >
                <span>{activeView()}</span>
              </div>
            </div>
          </div>
        </Match>
        <Match when={filtersPanelOpen()}>
          <div class="filters-panel-open">
            <div class="filters-panel-open-container">
              <FilterViewsNavigation
                activeView={activeView()}
                otherFiltersOpen={otherFiltersOpen()}
                setOtherFiltersOpen={setOtherFiltersOpen}
                handleActiveViewChange={handleActiveViewChange}
              />
              <Switch>
                <Match when={otherFiltersOpen()}>
                  <OtherFiltersContainer
                    activeView={activeView()}
                    searchTerm={searchTerm()}
                    handleSelectedMainFiltersChange={handleSelectedMainFiltersChange}
                  />
                </Match>
                <Match when={!otherFiltersOpen()}>
                  <MainFiltersContainer
                    searchTerm={searchTerm()}
                    activeView={activeView()}
                    setSearchTerm={setSearchTerm}
                    handleSelectedMainFiltersChange={handleSelectedMainFiltersChange}
                  />
                </Match>
              </Switch>
            </div>
          </div>
        </Match>
      </Switch>
    </div>
  );
};

const FilterViewsNavigation: Component<{
  activeView: string;
  otherFiltersOpen: boolean;
  setOtherFiltersOpen: (open: boolean) => void;
  handleActiveViewChange: (view: string) => void;
}> = (props) => {
  const { getFilterViews, getSelectedMainFilters } = amrStore;

  const getFiltersColor = () => {
    return props.otherFiltersOpen
      ? '#1B2C39'
      : getSelectedMainFilters().length > 0
        ? '#0099FF'
        : '#9AA7B1';
  };

  const handleFilterViewsToggle = () => {
    if (props.otherFiltersOpen) {
      return;
    }

    props.setOtherFiltersOpen(!props.otherFiltersOpen);
  };

  return (
    <div class="filter-views-nav-container">
      <div class="filter-views-nav-body">
        <span class="filter-views-nav-header">Data</span>
        {getFilterViews().length > 0 &&
          getFilterViews().map((view) => (
            <ens-text-button
              style={{
                'margin-left': '20px',
                'margin-bottom': '19px',
                'font-size': '13px',
                'font-weight': 'bold',
              }}
              onClick={() => props.handleActiveViewChange(view.name)}
            >
              <span
                style={{
                  color:
                    props.activeView !== view.name || props.otherFiltersOpen
                      ? '#0099FF'
                      : '#1B2C39',
                  'font-weight': 'bold',
                }}
              >
                {view.name}
              </span>
            </ens-text-button>
          ))}
      </div>
      <div class="filter-views-nav-body">
        <span class="filter-views-nav-header">Refine</span>
        <ens-text-button
          style={{
            'margin-left': '20px',
            'margin-bottom': '19px',
            'font-size': '13px',
            'font-weight': 'bold',
          }}
          onClick={handleFilterViewsToggle}
          disabled={getSelectedMainFilters().length === 0}
        >
          <span style={{ color: getFiltersColor(), 'font-weight': 'bold' }}>Filters</span>
        </ens-text-button>
      </div>
    </div>
  );
};

const MainFiltersContainer: Component<{
  searchTerm: string;
  activeView: string;
  setSearchTerm: (term: string) => void;
  handleSelectedMainFiltersChange: (e: Event, filter: SelectedFilter) => void;
}> = (props) => {
  const { getMainCategoryFilters, getSelectedMainFilters } = amrStore;

  return (
    <div class="main-filters-container">
      <div class="main-filters-header">
        <span>
          <span class="bold">
            {getMainCategoryFilters(props.activeView, props.searchTerm).length}
          </span>
          <span style={{ 'font-size': '13px' }}>{' ' + props.activeView}</span>
        </span>
        <ShadedInput placeholder="Find" value={props.searchTerm} onInput={props.setSearchTerm} />
      </div>
      <div class="main-filters-body">
        {getMainCategoryFilters(props.activeView, props.searchTerm).map((filter) => (
          <Checkbox
            checked={getSelectedMainFilters().some((f) => f.value === filter.value)}
            onChange={(e) => props.handleSelectedMainFiltersChange(e, filter)}
          >
            {filter.label}
          </Checkbox>
        ))}
      </div>
    </div>
  );
};

const OtherFiltersContainer: Component<{
  activeView: string;
  searchTerm: string;
  handleSelectedMainFiltersChange: (e: Event, filter: SelectedFilter) => void;
}> = (props) => {
  const [activeFilterCategory, setActiveFilterCategory] = createSignal<string>('');
  const [filterCategories, setFilterCategories] = createSignal<FilterCategory[]>([]);
  const { getSelectedMainFilters, getOtherCategoryFilters, getFilterCategoryById } = amrStore;

  onMount(() => {
    const otherCategoryFilters = getOtherCategoryFilters(props.activeView);
    if (otherCategoryFilters.length > 0) {
      const categoryGroup = otherCategoryFilters[0];
      setActiveFilterCategory(categoryGroup.name);

      const newFilterCategories: FilterCategory[] = [];
      categoryGroup.categories.forEach((category) => {
        const categoryData = getFilterCategoryById(category);
        if (categoryData) {
          newFilterCategories.push(categoryData);
        }
      });
      setFilterCategories(newFilterCategories);
    }
  });

  const handleOtherFilterChange = (category: string) => {
    setActiveFilterCategory(category);
    const categoryGroup = getOtherCategoryFilters(props.activeView).find(
      (group) => group.name === category
    );
    if (categoryGroup) {
      const newFilterCategories: FilterCategory[] = [];
      categoryGroup.categories.forEach((category) => {
        const categoryData = getFilterCategoryById(category);
        if (categoryData) {
          newFilterCategories.push(categoryData);
        }
      });
      setFilterCategories(newFilterCategories);
    }
  };

  const getFiltersColor = (category: string) => {
    return category === activeFilterCategory() ? '#1B2C39' : '#0099FF';
  };

  const handleSelectedOtherFiltersChange = (e: Event, fc: FilterCategory, filter: Filter) => {
    // e.stopPropagation();
    const selectedFilter: SelectedFilter = {
      category: fc.label,
      value: filter.value,
      label: filter.label,
    };
    props.handleSelectedMainFiltersChange(e, selectedFilter);
  };

  return (
    <div class="other-filters-container">
      <div class="other-filters-header">
        <span class="other-filters-header-title">Filter by</span>
        {getOtherCategoryFilters(props.activeView).length > 0 &&
          getOtherCategoryFilters(props.activeView).map((categoryGroup) => (
            <ens-text-button
              style={{
                'margin-right': '30px',
                'font-size': '13px',
                'font-weight': 'bold',
              }}
              onClick={() => handleOtherFilterChange(categoryGroup.name)}
              disabled={getSelectedMainFilters().length === 0}
            >
              <span style={{ color: getFiltersColor(categoryGroup.name), 'font-weight': 'bold' }}>
                {categoryGroup.name}
              </span>
            </ens-text-button>
          ))}
      </div>
      <div class="other-filters-body">
        {filterCategories().length > 0 &&
          filterCategories().map((fc) => (
            <div>
              <div class="other-filters-category-name">
                <span>{fc.label}</span>
              </div>
              <div class="other-filters-category-options">
                {fc.filters.map((filter) => (
                  <Checkbox
                    checked={getSelectedMainFilters().some((f) => f.value === filter.value)}
                    onChange={(e) => handleSelectedOtherFiltersChange(e, fc, filter)}
                  >
                    {filter.label}
                  </Checkbox>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default FiltersPanel;
