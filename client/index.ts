import { html, css, LitElement, type PropertyValues } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { getDataProvider, type LocalBackend } from '../data-provider/dataProvider';

import './components/top-panel/top-panel';
import './components/bottom-panel/bottom-panel';

import type { FiltersConfig } from '../types/filters/filtersConfig';
import type { FilterChangeEventPayload } from '../types/events/filterChangeEvent';

export type SelectedFilter = {
  category: string;
  value: string;
};

// We are expected to store filters independently against different views
export type SelectedFiltersState = Record<string, SelectedFilter[]>;

@customElement('amr-app')
export class AMRApp extends LitElement {
  static styles = css`
    :host {
      height: 100%;
      display: grid;
      grid-template-rows: 35% 1fr;
    }
  `;

  @state()
  viewMode: string | null = null;

  @state()
  dataProvider: LocalBackend;
  
  @state()
  filtersConfig: FiltersConfig | null;

  @state()
  selectedFilters: SelectedFiltersState = {};

  // protected willUpdate(changedProperties: PropertyValues) {
  //   if (changedProperties.has('selectionMode')) {
  //     this.fetchData();
  //   }
  // }


  connectedCallback() {
    super.connectedCallback();
    this.initialise();
  }

  initialise = async () => {
    await this.getDataProvider();
    this.filtersConfig = await this.dataProvider.getFiltersConfig();
    this.viewMode = this.filtersConfig.filterViews[0].name;
  }

  getDataProvider = async () => {
    this.dataProvider = await getDataProvider({ provider: 'local' });
  }

  onFilterChange = (event: CustomEvent<FilterChangeEventPayload>) => {
    if (!this.viewMode) {
      // this should never happen
      // filter change events can be dispatched only after some view mode has been set
      return
    }

    const payload = event.detail;
    const viewMode = this.viewMode;
    const newFilter = { category: payload.category, value: payload.value };
    if (payload.isSelected) {
      // add filter to state
      const selectedFilters = this.selectedFilters[viewMode];
      if (!selectedFilters) {
        this.selectedFilters[viewMode] = [newFilter];
      } else {
        this.selectedFilters[viewMode] = [...selectedFilters, newFilter];
      }
    } else {
      // remove filter from state
      const selectedFilters = this.selectedFilters[viewMode];
      const updatedFilters = selectedFilters.filter(({ category, value }) =>
        category !== payload.category || value !== payload.value);
      this.selectedFilters[viewMode] = updatedFilters;
    }

    this.requestUpdate();
  };

  onViewModeChange = (event: CustomEvent<string>) => {
    this.viewMode = event.detail;
  }
  

  render() {
    console.log('re-rendering index component')
    if (!this.dataProvider || !this.filtersConfig) {
      return html`
        <p>Loading...</p>
      `;
    }

    const selectedFilters = this.selectedFilters[this.viewMode] ?? [];

    return html`
      <top-panel
        .viewMode=${this.viewMode}
        .filtersConfig=${this.filtersConfig}
        .selectedFilters=${this.selectedFilters}
        @filter-changed=${this.onFilterChange}
        @view-mode-change=${this.onViewModeChange}
      ></top-panel>
      <bottom-panel
        .dataProvider=${this.dataProvider}
        .selectedFilters=${selectedFilters}
      ></bottom-panel>
    `;
  }

}

    //  <div style="height: 100%; overflow-y: auto;">
    //     ${ selectedFilters.length ? html`
    //       <pre>${JSON.stringify(selectedFilters, null, 2)}</pre>        
    //     ` : null}
    //   </div>