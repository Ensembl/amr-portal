import { html, css, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { FiltersConfig } from '../../../../types/filters/filtersConfig';

type FiltersGroupChangeEventPayload = {
  viewMode: string;
  filtersGroupName: string;
};

@customElement('filters-area-top')
export class FiltersAreaTop extends LitElement {
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

  @property({ type: String })
  viewMode: string;

  @property({ type: Boolean })
  isViewingExtraFilters: boolean;

  @property({ type: String })
  activeFiltersGroup: string | null;

  @property({ type: Object })
  filtersConfig: FiltersConfig;

  getFilterGroups() {
    const filtersView = this.filtersConfig.filterViews.find(view => view.name === this.viewMode);

    return filtersView.otherCategoryGroups;
  }

  onFiltersGroupSelect = (groupName: string) => {
    const eventPayload: FiltersGroupChangeEventPayload = {
      viewMode: this.viewMode,
      filtersGroupName: groupName
    };
    const event = new CustomEvent('filters-group-change', {
      detail: groupName,
      bubbles: true,
      composed: true
    });

    this.dispatchEvent(event);
  }

  render() {

    return html`
      <div>
        ${ this.isViewingExtraFilters ? this.renderFilterGroupsNav() : 'Hello' }
      </div>
    `;
  }

  renderFilterGroupsNav() {
    const filterGroups = this.getFilterGroups();

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