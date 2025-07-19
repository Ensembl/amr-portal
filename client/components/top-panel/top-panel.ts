import { html, css, LitElement, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import './top-panel-navigation/topPanelNavigation';
import './filters-area/filters-area';

import type { FiltersConfig } from '../../../types/filters/filtersConfig';
import type { SelectedFiltersState } from '../../index';


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

  @state()
  isViewingExtraFilters: boolean = false;

  #getActiveFiltersGroup = (): string | null => {
    return this.activeFiltersGroupForView[this.viewMode] ?? null;
  }

  #onExtraFiltersViewToggle = () => {
    if (this.isViewingExtraFilters && this.activeFiltersGroupForView[this.viewMode]) {
      this.activeFiltersGroupForView[this.viewMode] = null;
    }
    this.isViewingExtraFilters = !this.isViewingExtraFilters;
  }

  #onViewModeChange = () => {
    this.isViewingExtraFilters = false;
  }

  #onFiltersGroupChange = (event: CustomEvent<string>) => {
    const filtersGroupName = event.detail;
    const newActiveFilterGroupsState = { ...this.activeFiltersGroupForView };
    newActiveFilterGroupsState[this.viewMode] = filtersGroupName;
    this.activeFiltersGroupForView = newActiveFilterGroupsState;
  }

  render() {
    const activeFiltersGroup = this.#getActiveFiltersGroup();

    return html`
      <top-panel-navigation
        .currentViewMode=${this.viewMode}
        .filtersConfig=${this.filtersConfig}
        .isViewingExtraFilters=${this.isViewingExtraFilters}
        @view-mode-change=${this.#onViewModeChange}
        @extra-filters-click=${this.#onExtraFiltersViewToggle}
      >
      </top-panel-navigation>
      <filters-area
        .viewMode=${this.viewMode}
        .activeFiltersGroup=${activeFiltersGroup}
        .filtersConfig=${this.filtersConfig}
        .selectedFilters=${this.selectedFilters}
        .isViewingExtraFilters=${this.isViewingExtraFilters}
        @filters-group-change=${this.#onFiltersGroupChange}
      ></filters-area>
    `;
  }

}