import { html, css, LitElement, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import './top-panel-navigation/topPanelNavigation';
import './filters-area/filters-area';

import type { FiltersConfig } from '../../../types/filters/filtersConfig';
import type { SelectedFiltersState } from '../../index';

type QueryParams = {
  mode: 'antibiotics';
  filters: string[];
} | {
  mode: 'species';
  filters: Array<{ genus: string; species: string | null }>;
};



@customElement('top-panel')
export class TopPanel extends LitElement {
  static styles = css`
    :host {
      height: 100%;
      display: grid;
      grid-template-columns: 100px 1fr;
      column-gap: 1rem;
    }
  `;

  @property({ type: Object })
  filtersConfig: FiltersConfig;

  @property({ type: String })
  viewMode: string;

  @property({ type: Object })
  selectedFilters: SelectedFiltersState;

  @state()
  activeFiltersGroupForView: Record<string, string | null> = {};

  #getActiveFiltersGroup = (): string | null => {
    return this.activeFiltersGroupForView[this.viewMode] ?? null;
  }

  #onViewModeChange = () => {
    // reset active filter group for given view
    this.activeFiltersGroupForView[this.viewMode] = null;
  }

  #onFiltersGroupChange = (event: CustomEvent<string>) => {
    const filtersGroupName = event.detail;
    this.activeFiltersGroupForView[this.viewMode] = filtersGroupName;
  }

  render() {
    const activeFiltersGroup = this.#getActiveFiltersGroup();
    console.log('this.filtersConfig', this.filtersConfig);

    return html`
      <top-panel-navigation
        .currentViewMode=${this.viewMode}
        .activeFiltersGroup=${activeFiltersGroup}
        .filtersConfig=${this.filtersConfig}
      >
      </top-panel-navigation>
      <filters-area
        .viewMode=${this.viewMode}
        .activeFiltersGroup=${activeFiltersGroup}
        .filtersConfig=${this.filtersConfig}
        .selectedFilters=${this.selectedFilters}
      ></filters-area>
    `;
  }

}