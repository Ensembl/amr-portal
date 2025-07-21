import { html, css, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';

import filtersStore from '../../../state/filtersStore';


@customElement('top-panel-navigation')
export class TopPanelNavigation extends SignalWatcher(LitElement) {

  #onViewModeChange = (mode: string) => {
    filtersStore.setViewMode(mode);
  }

  #onExtraFiltersViewToggle = () => {
    filtersStore.toggleExtraFilters();
  }

  render() {
    const filtersConfig = filtersStore.filtersConfig.get();
    const currentViewMode = filtersStore.viewMode.get();
    const isViewingExtraFilters = filtersStore.isViewingExtraFilters.get();

    const viewModeButtons = filtersConfig.filterViews.map(view => html`
      <button
        @click=${() => this.#onViewModeChange(view.name)}
        ?disabled=${currentViewMode === view.name && !isViewingExtraFilters}
      >
        ${view.name}
      </button>        
    `);


    return html`
      <div>
        ${viewModeButtons}
        <button style="margin-top: 1.5rem;" @click=${this.#onExtraFiltersViewToggle}>
          Filters
        </button>
      </div>
    `;
  }

}