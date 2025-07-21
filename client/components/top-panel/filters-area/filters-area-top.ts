import { html, css, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';

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
        ${ isViewingExtraFilters ? this.renderFilterGroupsNav() : 'Hello' }
      </div>
    `;
  }

  renderFilterGroupsNav() {
    const filterGroups = filtersStore.filterGroupsForViewMode.get();

    // FIXME: put text buttons inside of the li elements

    return html`
      <ul class="filter-groups-nav">
        ${filterGroups.map(group => {
          return html`
            <li @click=${() => this.onFiltersGroupSelect(group.name)}>
              ${group.name}
            </li>
          `
        })}
      </ul>
    `;
  }


}