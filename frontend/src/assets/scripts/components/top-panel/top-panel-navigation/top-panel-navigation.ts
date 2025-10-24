import { html, css, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';

import '@ensembl/ensembl-elements-common/components/text-button/text-button.js';
import '../circle-counter/circle-counter';

import filtersStore from '../../../state/filtersStore';

import type { FiltersView } from '../../../types/filters/filtersConfig';


@customElement('top-panel-navigation')
export class TopPanelNavigation extends SignalWatcher(LitElement) {

  static styles = css`
    :host {
      min-width: 200px;
      box-sizing: border-box;
      padding-top: 24px;
      padding-left: 30px;
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

    .nav-item {
      display: grid;
      grid-template-columns: repeat(2, auto);
      column-gap: 0.6rem;
      align-items: center;
      justify-content: start;
      height: 22px; /* to prevent vertical shift when the counter is displayed */
    }
  `;

  #onViewModeChange = (mode: FiltersView['id']) => {
    filtersStore.setViewMode(mode);
  }

  render() {
    const filtersConfig = filtersStore.filtersConfig.get();
    const currentViewMode = filtersStore.viewMode.get();
    const selectedFilters = filtersStore.selectedFiltersForViewMode.get();
    const hasSelectedFilters = selectedFilters.length > 0;

    if (!currentViewMode) {
      // this should not happen
      return null;
    }

    const viewModeButtons = this.renderViewModeButtons({
      filterViews: filtersConfig!.filterViews,
      currentViewMode
    });
    
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
      </nav>
    `;
  }

  renderViewModeButtons({
    filterViews,
    currentViewMode
  }: {
    filterViews: FiltersView[];
    currentViewMode: FiltersView['id'] | null;
  }) {
    const filtersCount = filtersStore.appliedFiltersCount.get();

    const viewModeButtons = filterViews.map(view => {
      const isActiveView = currentViewMode === view.id;
      return html`
        <div class="nav-item">
          <ens-text-button
            @click=${() => this.#onViewModeChange(view.id)}
            ?disabled=${isActiveView}
          >
            ${view.name}
          </ens-text-button>
          ${ isActiveView && filtersCount ? html`
              <circle-counter>
                ${filtersCount}
              </circle-counter>
            ` : null
          }
        </div>
      `
    });

    return viewModeButtons;
  }

}