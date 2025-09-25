import { html, css, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';

import '@ensembl/ensembl-elements-common/components/text-button/text-button.js';
import '../circle-counter/circle-counter';

import resetStyles from '@ensembl/ensembl-elements-common/styles/constructable-stylesheets/resets.js';

import filtersStore from '../../../state/filtersStore';

@customElement('top-panel-navigation-collapsed')
export class TopPanelNavigation extends SignalWatcher(LitElement) {

  static styles = [
    resetStyles,
    css`
      :host {
        display: flex;
        column-gap: 1rem;
        align-items: center;
        padding-left: var(--standard-gutter);
      }

      .filters-label {
        color: var(--color-medium-dark-grey);
      }
    `
  ];

  #onViewButtonClick() {
    const event = new Event('top-panel-expand-click');
    this.dispatchEvent(event);
  }

  render() {
    const filtersConfig = filtersStore.filtersConfig.get();
    const currentViewMode = filtersStore.viewMode.get();
    const primaryFiltersCount = filtersStore.primaryFiltersCount.get();
    const otherFiltersCount = filtersStore.otherFiltersCount.get();

    const currentFiltersView = filtersConfig?.filterViews.find(view => view.id === currentViewMode);

    if (!currentViewMode || !currentFiltersView) {
      // this should not happen
      return null;
    }

    return html`
      <span>
        Data
      </span>
      <ens-text-button @click=${this.#onViewButtonClick}>
        ${currentFiltersView.name}
      </ens-text-button>
      <circle-counter ?dimmed=${primaryFiltersCount === 0}>
        ${primaryFiltersCount}
      </circle-counter>
      <span>
        Filters
      </span>
      <circle-counter ?dimmed=${otherFiltersCount === 0}>
        ${otherFiltersCount}
      </circle-counter>
    `;
  }

}