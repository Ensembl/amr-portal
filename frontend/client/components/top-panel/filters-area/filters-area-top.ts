import { html, css, nothing, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';

import '@ensembl/ensembl-elements-common/components/text-button/text-button.js';

import filtersStore from '../../../state/filtersStore';

@customElement('filters-area-top')
export class FiltersAreaTop extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: block;
    }

    .filter-groups-nav {
      display: flex;
      column-gap: 1rem;
    }

    .active {
      --text-button-disabled-color: var(--color-black);
    }

    li {
      list-style: none;
    }
  `;

  onFiltersGroupSelect = (groupName: string) => {
    const event = new CustomEvent('filters-group-change', {
      detail: groupName,
      bubbles: true,
      composed: true
    });

    this.dispatchEvent(event);
  }

  render() {
    const isViewingExtraFilters = filtersStore.isViewingExtraFilters.get();

    return html`
      <div>
        ${ isViewingExtraFilters ? this.renderFilterGroupsNav() : nothing }
      </div>
    `;
  }

  renderFilterGroupsNav() {
    const filterGroups = filtersStore.filterGroupsForViewMode.get();
    const activeFilterGroup = filtersStore.activeFilterGroup.get();

    return html`
      <ul class="filter-groups-nav">
        ${filterGroups.map(group => {
          const isActiveGroup = group.name === activeFilterGroup;

          return html`
            <ens-text-button
              class=${isActiveGroup ? 'active' : nothing}
              @click=${() => this.onFiltersGroupSelect(group.name)}
              ?disabled=${isActiveGroup}
            >
              ${group.name}
            </ens-text-button>
         `
        })}
      </ul>
    `;
  }


}