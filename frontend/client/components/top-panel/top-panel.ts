import { html, css, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';

import filtersStore from '../../state/filtersStore';

import './top-panel-navigation/top-panel-navigation';
import './filters-area/filters-area';

import { panelStyles } from '../panel/shared-panel-styles';


@customElement('top-panel')
export class TopPanel extends SignalWatcher(LitElement) {

  static styles = [
    panelStyles,
    css`
      :host {
        box-sizing: border-box;
        height: 100%;
        min-height: 300px;
        display: grid;
        grid-template-columns: auto 1fr;
        column-gap: 1rem;
      }
    `
  ];

  #onFiltersGroupChange = (event: CustomEvent<string>) => {
    const filtersGroupName = event.detail;
    filtersStore.setActiveFilterGroup(filtersGroupName);
  }

  render() {
    const activeFiltersGroup = filtersStore.activeFilterGroup.get();
    const viewMode = filtersStore.viewMode.get();
    const isViewingExtraFilters = filtersStore.isViewingExtraFilters.get();

    return html`
      <top-panel-navigation
        .currentViewMode=${viewMode}
        .isViewingExtraFilters=${isViewingExtraFilters}
      >
      </top-panel-navigation>
      <filters-area
        .viewMode=${viewMode}
        .activeFiltersGroup=${activeFiltersGroup}
        .isViewingExtraFilters=${isViewingExtraFilters}
        @filters-group-change=${this.#onFiltersGroupChange}
      ></filters-area>
    `;
  }

}