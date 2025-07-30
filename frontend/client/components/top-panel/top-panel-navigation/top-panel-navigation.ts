import { html, css, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { SignalWatcher } from '@lit-labs/signals';

import '@ensembl/ensembl-elements-common/components/text-button/text-button.js';

import filtersStore from '../../../state/filtersStore';


@customElement('top-panel-navigation')
export class TopPanelNavigation extends SignalWatcher(LitElement) {

  static styles = css`
    :host {
      box-sizing: border-box;
      padding-top: 24px;
      padding-left: 30px;
      padding-right: 30px;
      border-right: 1px solid var(--color-medium-light-grey);
    }

    nav {
      --text-button-disabled-color: var(--color-black);
      display: flex;
      flex-direction: column;
      row-gap: 1.8rem;
    }

    .section-title {
      margin-bottom: 20px;
    }

    .nav-items {
      --text-button-disabled-color: var(--color-black);
      display: flex;
      flex-direction: column;
      row-gap: 1rem;
      padding-left: 20px;
    }

    .filters-button-disabled {
      --text-button-disabled-color: var(--color-medium-dark-grey);
    }
  `;

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
    const selectedFilters = filtersStore.selectedFiltersForViewMode.get();
    const hasSelectedFilters = selectedFilters.length > 0;

    const viewModeButtons = filtersConfig!.filterViews.map(view => html`
      <ens-text-button
        @click=${() => this.#onViewModeChange(view.name)}
        ?disabled=${currentViewMode === view.name && !isViewingExtraFilters}
      >
        ${view.name}
      </ens-text-button>
    `);


    return html`
      <nav>
        <div class="section">
          <div class="section-title">
            Data
          </div>
          <div class="nav-items">
            ${viewModeButtons}
          </div>
        </div>
        <div class="section">
          <div class="section-title">
            Refine
          </div>
          <div class="nav-items">
            <ens-text-button
              @click=${this.#onExtraFiltersViewToggle}
              ?disabled=${isViewingExtraFilters || !hasSelectedFilters}
              class=${classMap({ 'filters-button-disabled': !hasSelectedFilters })}
            >
              Filters
            </ens-text-button>
          </div>
        </div>
      </nav>
    `;
  }

}